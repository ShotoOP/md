import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { setupRecaptcha, sendPhoneOTP } from "../utils/phoneAuth";

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
    mt5Account: "",
    tradingCapital: "",
    selectedPlan: "",
    riskRewardRatio: "",
    perDayTrades: "",
    capitalPercentageUsed: "",
    selectedSegments: "",
  });

  const [otpStatus, setOtpStatus] = useState({
    contactSent: false,
    emailSent: false,
    contactVerified: false,
    emailVerified: false,
  });

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const sendPhoneVerification = async () => {
    try {
      const recaptchaVerifier = setupRecaptcha("recaptcha-container");
      const confirmation = await sendPhoneOTP(formData.contactNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpStatus({ ...otpStatus, contactSent: true });
      alert("OTP sent successfully!");
    } catch (error) {
      alert("Failed to send OTP: " + error.message);
    }
  };

  const verifyPhoneOTP = async (otp) => {
    try {
      await confirmationResult.confirm(otp);
      setPhoneVerified(true);
      setOtpStatus({ ...otpStatus, contactVerified: true });
      alert("Phone number verified successfully!");
      
      // Update backend about phone verification
      await axios.post(
        "https://md-1-ga1n.onrender.com/api/verify-phone",
        { phoneNumber: formData.contactNumber },
        { withCredentials: true }
      );
    } catch (error) {
      alert("Invalid OTP. Please try again.");
    }
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
    if (!phoneVerified) {
      alert("Please verify your phone number first");
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
        "https://md-1-ga1n.onrender.com/api/algosoft-forms",
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
    <div className="container-fluid text-warning min-vh-100">
      <Header />
      <br />
      <div className="container py-5">
        <div
          className="container mt-5 p-4 text-warning rounded form-hover"
          style={{
            maxWidth: "400px",
            boxShadow: "0px 0px 15px gold",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h3 className="text-center mb-4">AlgoSoft</h3>
          <form onSubmit={handleSubmit}>
            <div id="recaptcha-container"></div>
            <div className="mb-3">
              <label className="form-label text-white">Contact Number</label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-telephone"></i>
                </span>
                <input
                  type="tel"
                  name="contactNumber"
                  className="form-control bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={sendPhoneVerification}
                  disabled={otpStatus.contactSent}
                >
                  Send OTP
                </button>
              </div>
            </div>
            {otpStatus.contactSent && !phoneVerified && (
              <div className="mb-3">
                <label className="form-label text-white">Enter Phone OTP</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-black text-warning"
                    style={{ border: "1px solid gold" }}
                    onChange={(e) => verifyPhoneOTP(e.target.value)}
                    maxLength="6"
                  />
                </div>
              </div>
            )}
            {[
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
            ].map(({ label, name, type = "text", icon }) => (
              <div className="mb-3" key={name}>
                <label className="form-label text-white">{label}</label>
                <div className="input-group">
                  <span
                    className="input-group-text bg-black text-warning"
                    style={{ border: "1px solid gold" }}
                  >
                    <i className={`bi ${icon} icon-gold`}></i>
                  </span>
                  <input
                    className="form-control bg-black text-warning"
                    style={{ border: "1px solid gold" }}
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
                  <span
                    className="input-group-text bg-black text-warning"
                    style={{ border: "1px solid gold" }}
                  >
                    <i className={`bi ${icon} icon-gold`}></i>
                  </span>
                  <input
                    className="form-control bg-black text-warning"
                    style={{ border: "1px solid gold" }}
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
              <label className="form-label text-white">
                MT5 Account Number
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-person-badge"></i>
                </span>
                <input
                  type="text"
                  name="mt5Account"
                  className="form-control bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                  value={formData.mt5Account}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Trading Info */}
            <div className="mb-3">
              <label className="form-label text-white">Trading Capital</label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-currency-dollar"></i>
                </span>
                <input
                  type="number"
                  name="tradingCapital"
                  className="form-control bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                  value={formData.tradingCapital}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label text-white">Selected Plan</label>
              <select
                name="selectedPlan"
                className="form-control bg-black text-warning"
                style={{ border: "1px solid gold" }}
                value={formData.selectedPlan}
                onChange={handleChange}
                required
              >
                <option value="">Select a plan</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label text-white">Segment Selection</label>
              <select
                name="selectedSegments"
                className="form-control bg-black text-warning"
                style={{ border: "1px solid gold" }}
                value={formData.selectedSegments}
                onChange={handleChange}
                required
              >
                <option value="">Select a segment</option>
                <option value="Currency Pairs">Currency Pairs</option>
                <option value="Cryptocurrency">Cryptocurrency</option>
                <option value="Indices">Indices</option>
                <option value="Commodities">Commodities</option>
              </select>
            </div>

            {/* Trading Preferences */}
            <div className="mb-3">
              <label className="form-label text-white">
                Risk to Reward Ratio
              </label>
              <input
                type="text"
                name="riskRewardRatio"
                className="form-control bg-black text-warning"
                style={{ border: "1px solid gold" }}
                value={formData.riskRewardRatio}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-white">Per Day Trades</label>
              <input
                type="number"
                name="perDayTrades"
                className="form-control bg-black text-warning"
                style={{ border: "1px solid gold" }}
                value={formData.perDayTrades}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-white">
                Trading Capital Percentage Used
              </label>
              <input
                type="number"
                name="capitalPercentageUsed"
                className="form-control bg-black text-warning"
                style={{ border: "1px solid gold" }}
                value={formData.capitalPercentageUsed}
                onChange={handleChange}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-warning"
                style={{ border: "1px solid gold" }}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default CustomerInformationForm;
