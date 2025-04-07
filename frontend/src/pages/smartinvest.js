import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function SmartInvestmentForm() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    contactNumber: "",
    email: "",
    whatsappNumber: "",
    selectedPlan: state?.planData?.planName || "", // Pre-fill with plan name
    addressProof: null,
    subcategory: state?.planData?.subcategory || "" // Add subcategory
  });

  // Add effect to handle navigation
  useEffect(() => {
    if (!state?.planData) {
      navigate("/plan");
    }
  }, [state, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({ ...formData, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataWithUser = {
        ...formData,
        userId: user.id,
        planId: state.planData.planId,
        planType: state.planData.planType,
        subcategory: state.planData.subcategory, // Include subcategory
        paymentDetails: state.paymentDetails,
      };

      await axios.post(
        "http://localhost:8081/api/smartinvest-forms",
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
    <div className="smartinvest">
      <Header />
      <div className="text-secondary px-4 py-5 text-start">
        <div
          className="container mt-5 p-4 bg-dark text-warning rounded"
          style={{
            maxWidth: "400px",
            boxShadow: "0px 0px 15px gold",
            border: "1px solid gold",
            transition: "0.3s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0px 0px 25px gold")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "0px 0px 15px gold")
          }
        >
          <h2
            className="text-center mb-4 text-warning"
            style={{ transition: "0.3s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "gold")}
          >
            Smart Investment
          </h2>
          <form onSubmit={handleSubmit} className="p-4">
            {/* Contact Number */}
            <div className="mb-3">
              <label className="form-label text-warning">
                Contact Number (OTP Verified)
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-telephone"></i>
                </span>
                <input
                  type="tel"
                  className="form-control text-light"
                  style={{ border: "1px solid gold", backgroundColor: "black" }}
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email ID */}
            <div className="mb-3">
              <label className="form-label text-warning">
                Email ID (OTP Verified)
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control text-light"
                  style={{ border: "1px solid gold", backgroundColor: "black" }}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="mb-3">
              <label className="form-label text-warning">WhatsApp Number</label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-whatsapp"></i>
                </span>
                <input
                  type="tel"
                  className="form-control text-light"
                  style={{ border: "1px solid gold", backgroundColor: "black" }}
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Selected Plan */}
            <div className="mb-3">
              <label className="form-label text-warning">
                Select Investment Plan
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-card-list"></i>
                </span>
                <select
                  className="form-select text-light"
                  style={{ border: "1px solid gold", backgroundColor: "black" }}
                  name="selectedPlan"
                  value={formData.selectedPlan}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Investment Plan</option>
                  <option value="basic">Basic Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="gold">Gold Plan</option>
                </select>
              </div>
            </div>

            {/* Address Proof Upload */}
            <div className="mb-3">
              <label className="form-label text-warning">
                Upload Address Proof
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-black text-warning"
                  style={{ border: "1px solid gold" }}
                >
                  <i className="bi bi-upload"></i>
                </span>
                <input
                  type="file"
                  className="form-control text-light"
                  style={{ border: "1px solid gold", backgroundColor: "black" }}
                  name="addressProof"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-warning w-100">
              Submit
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SmartInvestmentForm;
