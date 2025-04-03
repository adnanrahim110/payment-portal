import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { logo } from "../assets";

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");
  const [stripe, setStripe] = useState(null);
  const [paymentApiDetails, setPaymentApiDetails] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/${id}`);
        const data = await response.json();

        if (data.success) {
          setPaymentDetails(data.payment);
          setPaymentApiDetails(data.apiCredentials);

          if (data.apiCredentials.provider === "Stripe") {
            const stripeInstance = await loadStripe(
              data.apiCredentials.publicKey
            );
            setStripe(stripeInstance);
          }
        } else {
          setError(data.message || "Payment details not found.");
          setErrorType(data.paymentStatus || "error");
        }
      } catch (err) {
        setError("Error fetching payment details.");
        setErrorType("error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPaymentDetails();
    }
  }, [id]);

  const handlePaymentSuccess = async () => {
    try {
      // Mark the payment as completed
      const response = await fetch(
        `${API_BASE_URL}/api/payments/complete/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setError(
          "Payment completed successfully! This payment link has expired."
        );
        setErrorType("completed");
        setPaymentDetails(null);
      }
    } catch (err) {
      console.error("Error marking payment as complete:", err);
    }
  };

  const handlePaymentError = () => {
    fetchPaymentDetails();
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${id}`);
      const data = await response.json();

      if (data.success) {
        setPaymentDetails(data.payment);
      } else {
        setError(data.message || "Payment details not found.");
        setErrorType(data.paymentStatus || "error");
      }
    } catch (err) {
      setError("Error fetching payment details.");
      setErrorType("error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Stripe payment
  const handleStripePayment = async () => {
    if (!stripe || !paymentDetails) {
      return;
    }

    try {
      // Create a payment intent on the server
      const response = await fetch(`${API_BASE_URL}/api/payments/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          description: paymentDetails.description,
          payment_account: paymentDetails.payment_account,
          secureId: id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Create a card element for Stripe (simplified for this example)
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                email: paymentDetails.customer_email,
              },
            },
          }
        );

        if (error) {
          console.error("Payment failed:", error);
          handlePaymentError();
        } else {
          if (paymentIntent.status === "succeeded") {
            handlePaymentSuccess();
          }
        }
      } else {
        console.error("Failed to create payment intent:", data.message);
        handlePaymentError();
      }
    } catch (error) {
      console.error("Error processing Stripe payment:", error);
      handlePaymentError();
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="flex flex-col justify-center font-primary items-center">
          <div>
            <img src={logo} className="w-[200px] mt-[50px]" alt="Logo" />
          </div>
          <p className="text-center text-gray-600 mt-8">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="flex flex-col justify-center font-primary items-center">
          <div>
            <img src={logo} className="w-[200px] mt-[50px]" alt="Logo" />
          </div>
          <div
            className={`text-center mt-8 p-6 border rounded-lg ${
              errorType === "completed"
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-2 ${
                errorType === "completed" ? "text-green-700" : "text-red-700"
              }`}
            >
              {errorType === "completed"
                ? "Payment Successful"
                : "Payment Link Expired"}
            </h2>
            <p
              className={
                errorType === "completed" ? "text-green-600" : "text-red-600"
              }
            >
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currencySymbols = {
    USD: "$",
    GBP: "£",
    CAD: "$",
    EUR: "€",
  };

  const currencyUnit = currencySymbols[paymentDetails.currency] || "";

  return (
    <>
      <Helmet>
        <title>Checkout</title>
      </Helmet>
      <div className="container">
        <div className="flex flex-col justify-center font-primary items-center">
          <div>
            <img src={logo} className="w-[200px] mt-[50px]" alt="Logo" />
          </div>
          <div className="bg-white h-full shadow-black/50 shadow-md max-w-full w-[735px] my-14">
            <div className="bg-primary text-white px-5 py-3.5 uppercase">
              <h3 className="text-xl font-bold">Payment Information</h3>
            </div>
            <div className="flex flex-wrap *:max-w-full *:mt-0 *:px-4 mx-4 my-4">
              <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                <div className="flex flex-col gap-1.5 py-2.5">
                  <label>Description:</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={paymentDetails.description}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                <div className="flex flex-col gap-1.5 py-2.5">
                  <label>
                    Amount:{" "}
                    <span className="font-bold">{paymentDetails.currency}</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${paymentDetails.amount} ${currencyUnit}`}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                <div className="flex flex-col gap-1.5 py-2.5">
                  <label>Payment Attempts:</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${paymentDetails.paymentAttempts} / 2 (Max)`}
                  />
                </div>
              </div>
            </div>
            <div className="bg-primary text-white px-5 py-3.5 uppercase mb-6">
              <h3 className="text-xl font-bold">Billing</h3>
            </div>
            <div className="px-5 pb-5">
              {paymentDetails.payment_account.includes("Stripe") ? (
                <div className="text-center">
                  <button
                    onClick={handleStripePayment}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Pay with Stripe {currencyUnit}
                    {paymentDetails.amount}
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    You'll be redirected to Stripe's secure payment page
                  </p>
                </div>
              ) : paymentDetails.payment_account.includes("PayPal") &&
                paymentApiDetails?.clientId ? (
                <div className="mx-auto max-w-sm">
                  <PayPalScriptProvider
                    options={{
                      "client-id": paymentApiDetails.clientId,
                      currency: paymentDetails.currency,
                    }}
                  >
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                currency_code: paymentDetails.currency,
                                value: paymentDetails.amount,
                              },
                              description: paymentDetails.description,
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        return actions.order.capture().then(function (details) {
                          handlePaymentSuccess();
                        });
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                        handlePaymentError();
                      }}
                      onCancel={() => {
                        console.log("Payment cancelled");
                        // We don't count cancellations as failed attempts
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : (
                <p className="text-center text-red-600">
                  Payment method configuration error. Please contact support.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
