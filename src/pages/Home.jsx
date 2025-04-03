import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { logo } from "../assets";

const Home = () => {
  const [paymentType, setPaymentType] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPaymentType(e.target.value);
    setErrors({ ...errors, paymentType: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!paymentType) {
      setErrors({ paymentType: "Please select a payment type" });
      return;
    }

    navigate("create-payment", { state: { paymentType } });
  };

  return (
    <>
      <Helmet>
        <title>Home</title>
      </Helmet>
      <div className="container">
        <div className="flex flex-col justify-center font-primary items-center">
          <div>
            <img src={logo} className="w-[200px] mt-[50px]" alt="" />
          </div>
          <div className="bg-white h-full shadow-black/50 shadow-md max-w-3xl my-14">
            <form onSubmit={handleSubmit}>
              <div className="bg-primary text-white px-5 py-3.5 uppercase">
                <h3 className="text-xl font-bold">
                  Link Generator for payment
                </h3>
              </div>
              <div className="flex flex-wrap *:max-w-full *:mt-0 *:px-4 mx-4 my-4">
                <div className="w-full basis-auto grow-0 shrink-0">
                  <div className="flex flex-col gap-1.5 py-2.5">
                    <select
                      name="paymentType"
                      id="paymentType"
                      value={paymentType}
                      onChange={handleChange}
                    >
                      <option value="" disabled>
                        Payment Type
                      </option>
                      <option value="new_payment">New Payment</option>
                      <option value="up_sale">Up-Sale</option>
                    </select>
                    {errors.paymentType && (
                      <p className="text-red-500 text-sm">
                        {errors.paymentType}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full basis-auto grow-0 my-4 shrink-0">
                  <button type="submit">submit</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
