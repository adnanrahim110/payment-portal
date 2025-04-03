import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { logo } from "../assets";

const LinkGenerate = () => {
  const location = useLocation();
  const paymentId = location.state?.paymentId || "";
  const [paymentLink, setPaymentLink] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (paymentId) {
      setPaymentLink(`${window.location.origin}/checkout/${paymentId}`);
    }
  }, [paymentId]);

  const handleCopyLink = () => {
    if (!paymentLink || !inputRef.current) return;
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };

  return (
    <>
      <Helmet>
        <title>Link Generate</title>
      </Helmet>
      <div className="container">
        <div className="flex flex-col justify-center font-primary items-center">
          <div>
            <img src={logo} className="w-[200px] mt-[50px]" alt="" />
          </div>
          <div className="text-center py-5 w-full relative max-w-md">
            <h2 className="text-[#b36b00] text-[22px] my-5">
              Payment Link Generated
            </h2>
            <div className="relative w-full h-14 rounded-lg border border-blue-200 bg-white pr-32">
              <input
                ref={inputRef}
                type="text"
                readOnly={true}
                value={paymentLink}
                onClick={() => inputRef.current.select()}
                className="gnLink w-full p-3.5 h-14 rounded-lg font-medium outline-none focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`absolute right-1 top-1/2 px-0 border ${
                  copied
                    ? "text-green-600 bg-green-50 border-green-600"
                    : "bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100 hover:text-blue-800"
                } -translate-y-1/2 w-32 rounded-md h-12 inline-flex items-center justify-center text-sm`}
              >
                {copied ? (
                  <>
                    <svg
                      className="w-3 h-3 text-green-600 me-1.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 16 12"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M1 5.917 5.724 10.5 15 1.5"
                      />
                    </svg>
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3 me-1.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 18 20"
                    >
                      <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z" />
                    </svg>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LinkGenerate;
