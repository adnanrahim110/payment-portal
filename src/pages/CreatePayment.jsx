import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { logo } from "../assets";

const CreatePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const paymentType = location.state?.paymentType || "";

  const [formData, setFormData] = useState({
    amount: "",
    currency: "",
    payment_account: "",
    description: "",
    sales_email: "",
    customer_email: "",
  });

  const [paymentAccounts, setPaymentAccounts] = useState({
    stripe: [],
    paypal: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPaymentAccounts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payment-accounts`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPaymentAccounts({
          stripe: data.paymentAccounts
            .filter((account) => account.type === "Stripe")
            .map((account) => account.name),
          paypal: data.paymentAccounts
            .filter((account) => account.type === "PayPal")
            .map((account) => account.name),
        });
      } catch (error) {
        console.error("Error fetching payment accounts:", error);
      }
    };

    fetchPaymentAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = [];
    if (!formData.amount) validationErrors.amount = "Amount is required. *";
    if (!formData.currency)
      validationErrors.currency = "Currency is required. *";
    if (!formData.payment_account)
      validationErrors.payment_account = "Payment Account is required. *";
    if (!formData.description)
      validationErrors.description = "Description is required. *";
    if (!formData.sales_email)
      validationErrors.sales_email = "Sales Email is required. *";
    if (!formData.customer_email)
      validationErrors.customer_email = "Customer Email is required. *";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, paymentType }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/link-generate", {
          state: {
            paymentId: data.paymentId,
            paymentAccount: formData.payment_account,
          },
        });
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save payment details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Payment</title>
      </Helmet>
      <div className="container">
        <div className="flex flex-col justify-center font-primary items-center">
          <div>
            <img src={logo} className="w-[200px] mt-[50px]" alt="" />
          </div>
          <div className="bg-white h-full shadow-black/50 shadow-md max-w-3xl my-14">
            <form onSubmit={handleSubmit}>
              <div className="bg-primary text-white px-5 py-3.5 uppercase">
                <h3 className="text-xl font-bold">Payment Information</h3>
              </div>
              <div className="flex flex-wrap *:max-w-full *:mt-0 *:px-4 mx-4 my-4">
                <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <label htmlFor="amount">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="amount"
                        placeholder="Amount..."
                        value={formData.amount}
                        onChange={handleChange}
                      />
                      {errors.amount && (
                        <p className="text-red-500 text-xs font-medium -mt-1 absolute top-full">
                          {errors.amount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <label htmlFor="currency">Currency</label>
                    <div className="relative">
                      <select
                        name="currency"
                        id="currency"
                        value={formData.currency}
                        onChange={handleChange}
                      >
                        <option value="" disabled>
                          Currency
                        </option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      {errors.currency && (
                        <p className="text-red-500 text-xs font-medium -mt-1 absolute top-full">
                          {errors.currency}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full grow-0 shrink-0 basis-auto">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <label htmlFor="payment_account">Payment Account</label>
                    <div className="relative">
                      <select
                        name="payment_account"
                        id="payment_account"
                        value={formData.payment_account}
                        onChange={handleChange}
                      >
                        <option value="" disabled>
                          Payment Account
                        </option>
                        {paymentAccounts.stripe.map((account, index) => (
                          <option key={index} value={account}>
                            {account} (Stripe)
                          </option>
                        ))}
                        {paymentAccounts.paypal.map((account, index) => (
                          <option key={index} value={account}>
                            {account} (PayPal)
                          </option>
                        ))}
                      </select>
                      {errors.payment_account && (
                        <p className="text-red-500 text-xs font-medium -mt-1 absolute top-full">
                          {errors.payment_account}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full basis-auto grow-0 shrink-0">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <label htmlFor="description">Description</label>
                    <div className="relative">
                      <textarea
                        name="description"
                        cols={25}
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="p-4"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-xs font-medium -mt-2 absolute top-full">
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <label htmlFor="sales_email">Sales Person Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="sales_email"
                        value={formData.sales_email}
                        onChange={handleChange}
                        placeholder="example@yourdomain.com"
                      />
                      {errors.sales_email && (
                        <p className="text-red-500 text-xs font-medium -mt-1 absolute top-full">
                          {errors.sales_email}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-4 mt-1.5">
                      This email will get an alert when the customer will make
                      the payment other then default alert emails of billing@...
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 grow-0 shrink-0 basis-auto">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <label htmlFor="customer_email">Customer Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                      />
                      {errors.customer_email && (
                        <p className="text-red-500 text-xs font-medium -mt-1 absolute top-full">
                          {errors.customer_email}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-4 mt-1.5">
                      Customer will get an alert with a link of payment in
                      email. Sales person will also get a copy of that email.
                    </p>
                  </div>
                </div>
                <div className="w-full basis-auto grow-0 my-4 shrink-0">
                  <button disabled={loading} type="submit">
                    {loading ? "Processing..." : "Submit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePayment;
