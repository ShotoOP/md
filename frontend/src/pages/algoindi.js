import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function CustomerInformationForm() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Add effect to handle navigation
  useEffect(() => {
    if (!state?.planData) {
      navigate("/plan");
    }
  }, [state, navigate]);

  const [formData, setFormData] = useState({
    contactNumber: "",
    email: "",
    whatsappNumber: "",
    tradingViewUserId: "",
    selectedPlan: "",
    contactOtp: "",
    emailOtp: "",
  });

  const [otpStatus, setOtpStatus] = useState({
    contactSent: false,
    emailSent: false,
    contactVerified: false,
    emailVerified: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const sendOtp = (type) => {
    if (
      (type === "contact" && formData.contactNumber) ||
      (type === "email" && formData.email)
    ) {
      setOtpStatus({ ...otpStatus, [`${type}Sent`]: true });
      alert(`${type === "contact" ? "Contact" : "Email"} OTP sent!`);
    }
  };

  const verifyOtp = (type) => {
    if (
      (type === "contact" && formData.contactOtp === "1234") ||
      (type === "email" && formData.emailOtp === "5678")
    ) {
      setOtpStatus({ ...otpStatus, [`${type}Verified`]: true });
      alert(`${type === "contact" ? "Contact" : "Email"} OTP verified!`);
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpStatus.contactVerified || !otpStatus.emailVerified) {
      alert("Please verify both OTPs before submitting.");
      return;
    }
    try {
      const formDataWithUser = {
        ...formData,
        userId: user.id,
        planId: state.planData.planId,
        planType: state.planData.planType,
        paymentDetails: state.paymentDetails
      };

      await axios.post(
        "http://localhost:8081/api/algoindi-forms",
        formDataWithUser,
        { withCredentials: true }
      );

      navigate("/user-dashboard");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form. Please try again.");
    }
  };

  return (
    <div className="algosoft">
      <div className="text-secondary px-4 py-5 text-start">
        <Header />
        <div
          className="container mt-5 p-4 text-warning rounded form-hover"
          style={{
            maxWidth: "400px",
            boxShadow: "0px 0px 15px gold",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h3 className="text-center mb-4 text-warning">Algo Indicator</h3>
          <form onSubmit={handleSubmit}>
            {[
              {
                label: "Contact Number",
                name: "contactNumber",
                icon: "bi-telephone",
              },
              {
                label: "Email Address",
                name: "email",
                type: "email",
                icon: "bi-envelope",
              },
              {
                label: "WhatsApp Number",
                name: "whatsappNumber",
                icon: "bi-whatsapp",
              },
              {
                label: "TradingView User ID",
                name: "tradingViewUserId",
                icon: "bi-person",
              },
            ].map(({ label, name, type = "text", icon }) => (
              <div className="mb-3" key={name}>
                <label className="form-label text-white">{label}</label>
                <div className="input-group">
                  <span className="input-group-text bg-black text-warning border-gold">
                    <i className={`bi ${icon} icon-gold`}></i>
                  </span>
                  <input
                    className="form-control bg-black text-warning border-gold"
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            ))}

            {[
              {
                label: "Contact OTP",
                name: "contactOtp",
                icon: "bi-key",
                type: "contact",
              },
              {
                label: "Email OTP",
                name: "emailOtp",
                icon: "bi-key",
                type: "email",
              },
            ].map(({ label, name, icon, type }) => (
              <div className="mb-3" key={name}>
                <label className="form-label text-white">{label}</label>
                <div className="input-group">
                  <span className="input-group-text bg-black text-warning border-gold">
                    <i className={`bi ${icon} icon-gold`}></i>
                  </span>
                  <input
                    className="form-control bg-black text-warning border-gold"
                    type="text"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={!otpStatus[`${type}Sent`]}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-warning"
                    onClick={() => sendOtp(type)}
                    disabled={otpStatus[`${type}Sent`]}
                  >
                    Send OTP
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => verifyOtp(type)}
                    disabled={otpStatus[`${type}Verified`]}
                  >
                    Verify
                  </button>
                </div>
              </div>
            ))}

            <div className="mb-3">
              <label className="form-label text-white">Selected Plan</label>
              <select
                className="form-control bg-black text-warning border-gold"
                name="selectedPlan"
                value={formData.selectedPlan}
                onChange={handleChange}
                required
              >
                <option value="">Select a plan</option>
                {["Basic", "Standard", "Premium", "Pro"].map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-warning w-100">
              Submit
            </button>
          </form>
        </div>
      </div>
      <Footer />
      <style>
        {`
          .border-gold {
            border: 1px solid gold !important;
          }
          .icon-gold {
            color: gold;
          }
          .form-hover:hover {
            transform: scale(1.02);
            transition: transform 0.3s ease-in-out;
            box-shadow: 0px 0px 20px gold;
          }
        `}
      </style>
    </div>
  );
}

export default CustomerInformationForm;
