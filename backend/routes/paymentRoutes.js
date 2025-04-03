import express from "express";
import paypal from "paypal-rest-sdk";
import Stripe from "stripe";
import Payment from "../models/Payment.js";
import { generateSecureId } from "../utils/helpers.js"; // We'll create this utility

const router = express.Router();

// Store Payment in Database
router.post("/", async (req, res) => {
  try {
    // Generate a unique, secure, complex ID for the payment link
    const secureId = generateSecureId();
    const newPayment = new Payment({
      ...req.body,
      secureId,
      status: "pending",
      paymentAttempts: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Link expires in 24 hours
    });
    await newPayment.save();
    res.status(201).json({ success: true, paymentId: secureId });
  } catch (err) {
    console.error("Error saving payment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get payment by secure ID
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findOne({ secureId: req.params.id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    // Check if payment is expired or already completed
    if (payment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This payment link has expired. Payment has been completed successfully.",
        paymentStatus: "completed"
      });
    }

    // Check if payment link has expired
    if (payment.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This payment link has expired.",
        paymentStatus: "expired"
      });
    }

    // Check if too many failed payment attempts
    if (payment.paymentAttempts >= 2) {
      return res.status(400).json({
        success: false,
        message: "Too many incorrect payment attempts. This link has expired.",
        paymentStatus: "maxAttempts"
      });
    }

    // Get all available payment accounts from environment variables
    const envVars = Object.keys(process.env);

    // Filter for Stripe accounts
    const stripeAccounts = envVars
      .filter(key => key.startsWith('STRIPE_') && key.endsWith('_PUBLIC_KEY'))
      .map(key => {
        const accountName = key.replace('_PUBLIC_KEY', '');
        return {
          name: accountName.replace('STRIPE_', '').replace(/_/g, ' '),
          public_key: process.env[key],
        };
      });

    // Filter for PayPal accounts
    const paypalAccounts = envVars
      .filter(key => key.startsWith('PAYPAL_') && key.endsWith('_CLIENT_ID'))
      .map(key => {
        const accountName = key.replace('_CLIENT_ID', '');
        return {
          name: accountName.replace('PAYPAL_', '').replace(/_/g, ' '),
          client_id: process.env[`${accountName}_CLIENT_ID`],
          secret_key: process.env[`${accountName}_SECRET_KEY`],
        };
      });

    let apiCredentials = {};

    // Fetch credentials based on payment method
    if (payment.payment_account.includes("Stripe")) {
      const stripeName = `STRIPE_${payment.payment_account.replace("Stripe ", "").replace(/ /g, "_").toUpperCase()}_PUBLIC_KEY`;
      apiCredentials = {
        provider: "Stripe",
        publicKey: process.env[stripeName],
      };
    }
    else if (payment.payment_account.includes("PayPal")) {
      const paypalName = `PAYPAL_${payment.payment_account.replace("PayPal ", "").replace(/ /g, "_").toUpperCase()}_CLIENT_ID`;
      apiCredentials = {
        provider: "PayPal",
        clientId: process.env[paypalName],
      };
    }

    res.json({ success: true, payment, apiCredentials });
  } catch (err) {
    console.error("Error fetching payment", err);
    res.status(500).json({ success: false, message: "Error fetching payment" });
  }
});

// Process Stripe Payment with Selected Stripe Account
router.post("/stripe", async (req, res) => {
  const { amount, currency, description, payment_account, secureId } = req.body;

  try {
    // Find the payment to update attempts
    const payment = await Payment.findOne({ secureId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    // Increment the payment attempts
    payment.paymentAttempts += 1;
    await payment.save();

    // Dynamically get the Stripe secret key based on the account name
    const accountKey = payment_account.replace("Stripe ", "").replace(/ /g, "_").toUpperCase();
    const stripeSecretKey = process.env[`STRIPE_${accountKey}_SECRET_KEY`];

    if (!stripeSecretKey) {
      return res.status(400).json({ success: false, message: "Invalid Stripe account selected." });
    }

    const stripe = new Stripe(stripeSecretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      description,
      payment_method_types: ["card"],
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, message: "Stripe Payment Failed" });
  }
});

// Process PayPal Payment with Selected PayPal Account
router.post("/paypal", async (req, res) => {
  const { amount, currency, description, payment_account, secureId } = req.body;

  try {
    // Find the payment to update attempts
    const payment = await Payment.findOne({ secureId });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    // Increment the payment attempts
    payment.paymentAttempts += 1;
    await payment.save();

    // Dynamically get the PayPal credentials based on the account name
    const accountKey = payment_account.replace("PayPal ", "").replace(/ /g, "_").toUpperCase();
    const clientId = process.env[`PAYPAL_${accountKey}_CLIENT_ID`];
    const secretKey = process.env[`PAYPAL_${accountKey}_SECRET_KEY`];

    if (!clientId || !secretKey) {
      return res.status(400).json({ success: false, message: "Invalid PayPal account selected." });
    }

    paypal.configure({
      mode: "sandbox", // Change to "live" in production
      client_id: clientId,
      client_secret: secretKey,
    });

    const createPayment = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      transactions: [{ amount: { total: amount, currency }, description }],
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL}/payment-success/${secureId}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel/${secureId}`,
      },
    };

    paypal.payment.create(createPayment, (error, payment) => {
      if (error) {
        console.error("PayPal Error:", error);
        res.status(500).json({ success: false, message: "PayPal Payment Failed" });
      } else {
        const approvalUrl = payment.links.find(link => link.rel === "approval_url").href;
        res.status(200).json({ success: true, approvalUrl });
      }
    });
  } catch (error) {
    console.error("PayPal Error:", error);
    res.status(500).json({ success: false, message: "PayPal Payment Failed" });
  }
});

// Mark payment as completed
router.post("/complete/:id", async (req, res) => {
  try {
    const payment = await Payment.findOne({ secureId: req.params.id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    payment.status = "completed";
    await payment.save();

    res.status(200).json({ success: true, message: "Payment marked as completed." });
  } catch (error) {
    console.error("Error completing payment:", error);
    res.status(500).json({ success: false, message: "Error completing payment" });
  }
});

export default router;
