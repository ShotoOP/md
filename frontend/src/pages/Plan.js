// frontend/src/pages/Plan.js
import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const durationMultipliers = {
  "18 Months": 1,
  "21 Months": 1.2,
  "24 Months": 1.5,
};

function Plan() {
  const [currentCategory, setCurrentCategory] = useState("basic");
  const [selectedSubcategory, setSelectedSubcategory] = useState("One Time");
  const [selectedDuration, setSelectedDuration] = useState("18 Months");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch plans from the database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://md-url.onrender.com/api/plan-configurations"
        );
        console.log("Plans fetched successfully:", response.data);
        setPlans(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError(
          `Failed to load plans: ${err.response?.data?.error || err.message}`
        );
      } finally {
        setLoading(false); 
      }
    };

    fetchPlans();
  }, []);

  // Filter plans by category, excluding enterprise plans from main display
  const filteredPlans = plans.filter(
    (plan) => plan.plan_type === currentCategory && currentCategory !== "enterprise"
  );

  // Apply duration multipliers to pricing for premium plans
  const displayPlans = filteredPlans.map((plan) => {
    let price = plan.base_price;

    if (currentCategory === "premium" && selectedDuration) {
      const multiplier = durationMultipliers[selectedDuration];
      price = price * multiplier;
    }

    return {
      ...plan,
      price: `$${price.toFixed(2)}`,
      features: plan.features || {},
    };
  });

  const renderSmartInvestmentPlans = (subcategory) => {
    const smartInvestmentPlans = plans.filter(
      (plan) => plan.plan_type === "enterprise" && plan.subcategory === subcategory
    );

    if (smartInvestmentPlans.length === 0) {
      return (
        <div className="alert alert-warning text-center">
          No plans available for this subcategory. Please check back later.
        </div>
      );
    }

    return (
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
        {smartInvestmentPlans.map((plan) => (
          <div key={plan.id} className="col-md-4 mb-4">
            <div
              className="card pricing-card h-100 text-white hover-effect"
              style={{
                backgroundColor: "#1a1a1a",
                transition: "border-color 0.3s ease",
                backgroundImage:
                  "url('https://img.freepik.com/free-vector/abstract-black-gold-luxury-background_361591-4346.jpg?t=st=1742013613~exp=1742017213~hmac=acc2623f9672c7062cc6ac248da6fe6b91d9d39814eb10a677e1bd0dac56fb7c&w=360')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                className="card-header fw-bold text-center"
                style={{
                  color: "#ffc107",
                  padding: "15px",
                  fontSize: "1.5rem",
                  borderBottom: "none",
                }}
              >
                {plan.plan_name}
              </div>
              <div className="card-body d-flex flex-column text-center">
                <h1 className="card-title text-white">
                  ${plan.base_price}
                  <small className="text-warning">/mo</small>
                </h1>
                <ul className="list-unstyled mt-3 mb-4 text-start">
                  {plan.features &&
                    Object.entries(plan.features).map(([key, value]) =>
                      value ? (
                        <li key={key} className="border-bottom pb-2">
                          ✔ {value}
                        </li>
                      ) : null
                    )}
                </ul>
                <button
                  type="button"
                  className="w-100 btn btn-lg btn-outline-warning mt-auto"
                  onClick={() => handlePlanPurchase(plan)}
                >
                  Choose Plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handlePlanPurchase = (plan) => {
    if (!user) {
      alert("Please log in to purchase a plan.");
      navigate("/login");
      return;
    }

    // Determine plan type and get the actual price
    let planType;
    let planPrice = plan.base_price; // Use base_price directly for enterprise plans

    switch (currentCategory) {
      case "basic":
        planType = "Algo Software";
        break;
      case "premium":
        planType = "Indicator Plan";
        break;
      case "enterprise":
        planType = "Algo Smart Investment";
        break;
      default:
        planType = "Algo Software";
    }

    const planData = {
      userId: user.id,
      planName: plan.plan_name,
      planPrice: planPrice,
      realPrice: plan.real_price || planPrice,
      duration: selectedDuration || "18 Months",
      planType: planType,
      planId: plan.id,
      subcategory: currentCategory === "enterprise" ? selectedSubcategory : null,
      token: localStorage.getItem('authToken') // Add auth token
    };

    // Navigate to payment page with plan data
    navigate("/payment", { state: { planData } });
  };

  const handleSubcategoryChange = (subcategory) => {
    setSelectedSubcategory(subcategory);
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mt-5 pt-5 text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white">Loading plans...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="container mt-5 pt-5 text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button
            className="btn btn-warning mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="Plan">
      <Header />
      <div className="px-4 py-5 text-center position-relative">
        <h2 className="py-4 pb-2 border-bottom text-warning">
          Mindstocs Pricing
        </h2>
        <p className="fw-semibold text-white">
          Choose a plan that best suits your needs.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
          <button
            className={`btn fw-bold px-4 py-2 rounded text-white ${currentCategory === "basic" ? "btn-warning" : ""
              }`}
            style={{
              fontSize: "1.2rem",
              backgroundColor: currentCategory === "basic" ? "" : "#333",
              border: "none",
              transition: "background-color 0.3s, color 0.3s",
              color: currentCategory === "basic" ? "#000" : "#fff",
            }}
            onClick={() => setCurrentCategory("basic")}
          >
            Algo Software
          </button>
          <button
            className={`btn fw-bold px-4 py-2 rounded text-white ${currentCategory === "premium" ? "btn-warning" : ""
              }`}
            style={{
              fontSize: "1.2rem",
              backgroundColor: currentCategory === "premium" ? "" : "#333",
              border: "none",
              transition: "background-color 0.3s, color 0.3s",
              color: currentCategory === "premium" ? "#000" : "#fff",
            }}
            onClick={() => setCurrentCategory("premium")}
          >
            Algo Indicator
          </button>
          <button
            className={`btn fw-bold px-4 py-2 rounded text-white ${currentCategory === "enterprise" ? "btn-warning" : ""
              }`}
            style={{
              fontSize: "1.2rem",
              backgroundColor: currentCategory === "enterprise" ? "" : "#333",
              border: "none",
              transition: "background-color 0.3s, color 0.3s",
              color: currentCategory === "enterprise" ? "#000" : "#fff",
            }}
            onClick={() => setCurrentCategory("enterprise")}
          >
            Smart Investment
          </button>
        </div>

        {currentCategory === "premium" && (
          <div className="d-flex justify-content-center gap-3 mb-4">
            <select
              className="form-select w-auto"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
            >
              {Object.keys(durationMultipliers).map((duration) => (
                <option key={duration} value={duration}>
                  {duration}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentCategory !== "enterprise" ? (
          displayPlans.length === 0 ? (
            <div className="alert alert-warning text-center">
              No plans available for this category. Please check back later or try another category.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
              {displayPlans.map((plan) => (
                <div className="col" key={plan.id}>
                  <div
                    className="card pricing-card h-100 text-white hover-effect"
                    style={{
                      backgroundColor: "#1a1a1a",
                      transition: "border-color 0.3s ease",
                      backgroundImage:
                        "url('https://img.freepik.com/free-vector/abstract-black-gold-luxury-background_361591-4346.jpg?t=st=1742013613~exp=1742017213~hmac=acc2623f9672c7062cc6ac248da6fe6b91d9d39814eb10a677e1bd0dac56fb7c&w=360')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div
                      className="card-header fw-bold text-center"
                      style={{
                        color: "#ffc107",
                        padding: "15px",
                        fontSize: "1.5rem",
                        borderBottom: "none",
                      }}
                    >
                      {plan.plan_name}
                    </div>
                    <div className="card-body d-flex flex-column text-center">
                      <h1 className="card-title text-white">
                        {plan.price}
                        <small className="text-warning">/mo</small>
                      </h1>
                      <ul className="list-unstyled mt-3 mb-4 text-start">
                        {plan.features &&
                          Object.entries(plan.features).map(([key, value]) =>
                            value ? (
                              <li key={key} className="border-bottom pb-2">
                                ✔ {value}
                              </li>
                            ) : null
                          )}
                      </ul>
                      <button
                        type="button"
                        className="w-100 btn btn-lg btn-outline-warning mt-auto"
                        onClick={() => handlePlanPurchase(plan)}
                      >
                        Choose Plan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="mt-4">
            <div className="d-flex justify-content-center gap-3 mb-4">
              {["One Time", "Profit Split", "Income Flow Builder"].map((subcategory) => (
                <button
                  key={subcategory}
                  className={`btn fw-bold px-4 py-2 rounded text-white ${selectedSubcategory === subcategory ? "btn-warning" : "btn-outline-warning"
                    }`}
                  onClick={() => handleSubcategoryChange(subcategory)}
                >
                  {subcategory}
                </button>
              ))}
            </div>
            {renderSmartInvestmentPlans(selectedSubcategory)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Plan;
