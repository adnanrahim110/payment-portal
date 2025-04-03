import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Connection Error:", err));

app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("API is working!");
});

// Provide API for payment accounts - dynamically fetches from environment variables
app.get("/api/payment-accounts", (req, res) => {
  try {
    const envVars = Object.keys(process.env);

    // Get all Stripe accounts
    const stripeAccounts = envVars
      .filter(key => key.startsWith('STRIPE_') && key.endsWith('_PUBLIC_KEY'))
      .map(key => {
        const accountName = key.replace('_PUBLIC_KEY', '').replace('STRIPE_', '').replace(/_/g, ' ');
        return {
          name: `Stripe ${accountName}`,
          type: "Stripe",
          public_key: process.env[key],
        };
      });

    // Get all PayPal accounts
    const paypalAccounts = envVars
      .filter(key => key.startsWith('PAYPAL_') && key.endsWith('_CLIENT_ID'))
      .map(key => {
        const accountName = key.replace('_CLIENT_ID', '').replace('PAYPAL_', '').replace(/_/g, ' ');
        return {
          name: `PayPal ${accountName}`,
          type: "PayPal",
          client_id: process.env[key],
        };
      });

    res.json({
      success: true,
      paymentAccounts: [...stripeAccounts, ...paypalAccounts]
    });
  } catch (error) {
    console.error("Error fetching payment accounts:", error);
    res.status(500).json({ success: false, message: "Error fetching payment accounts" });
  }
});

// Get specific payment account credentials
app.get('/api/payment-accounts/:accountName', (req, res) => {
  try {
    const { accountName } = req.params;

    if (accountName.startsWith('Stripe')) {
      const stripeName = accountName.replace('Stripe ', '').replace(/ /g, '_').toUpperCase();
      const publicKey = process.env[`STRIPE_${stripeName}_PUBLIC_KEY`];

      if (!publicKey) {
        return res.status(404).json({ success: false, message: "Stripe account not found." });
      }

      return res.json({
        success: true,
        apiCredentials: {
          publicKey: publicKey,
          provider: 'Stripe'
        }
      });
    }

    if (accountName.startsWith('PayPal')) {
      const paypalName = accountName.replace('PayPal ', '').replace(/ /g, '_').toUpperCase();
      const clientId = process.env[`PAYPAL_${paypalName}_CLIENT_ID`];

      if (!clientId) {
        return res.status(404).json({ success: false, message: "PayPal account not found." });
      }

      return res.json({
        success: true,
        apiCredentials: {
          clientId: clientId,
          provider: 'PayPal'
        }
      });
    }

    return res.status(404).json({ success: false, message: "Account not found." });
  } catch (error) {
    console.error("Error fetching account details:", error);
    res.status(500).json({ success: false, message: "Error fetching account details" });
  }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
