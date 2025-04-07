// frontend/src/pages/PaymentPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../context/AuthContext.js"; // Add this import
import Header from "../components/Header";
import Footer from "../components/Footer";
import LiveChat from "../components/LiveChat";
import { useLocation, useNavigate } from "react-router-dom";
import "./Home.css"; // Reuse the existing styles
import "./PaymentPage.css"; // We'll create this file for receipt styling
import { FaTag } from "react-icons/fa";

const PaymentPage = () => {
  const { state } = useLocation();
  const { planData, isUpgrade, currentPlan } = state || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null); // Add error state
  const [planDuration, setPlanDuration] = useState(""); // Add state for duration
  const [upgradeDiscount, setUpgradeDiscount] = useState(0);
  const [combinedDuration, setCombinedDuration] = useState("");

  // Remove planData duration validation since it will come from admin

  // Add promo code state variables
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeMessage, setPromoCodeMessage] = useState(null);
  const [promoCodeDiscount, setPromoCodeDiscount] = useState(0);
  const [validatingPromoCode, setValidatingPromoCode] = useState(false);

  // Add these new state variables
  const [durationPromoCode, setDurationPromoCode] = useState("");
  const [durationReduction, setDurationReduction] = useState(null);
  const [durationPromoMessage, setDurationPromoMessage] = useState(null);
  const [validatingDurationPromo, setValidatingDurationPromo] = useState(false);

  // Generate a receipt number
  const receiptNumber = `RCPT-${Date.now().toString().slice(-8)}`;
  const purchaseDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate prices with discount
  const planPrice = planData ? parseFloat(planData.planPrice) : 0;
  const discountAmount =
    promoCodeDiscount > 0 ? (planPrice * promoCodeDiscount) / 100 : 0;
  const upgradeDiscountAmount = isUpgrade ? upgradeDiscount : 0;
  const discountedPrice = planPrice - discountAmount - upgradeDiscountAmount;

  // Calculate tax and total based on discounted price
  const taxRate = 0.18; // 18% tax
  const taxAmount = discountedPrice * taxRate;
  const totalAmount = discountedPrice + taxAmount;
  const [referralCode, setReferralCode] = useState("");

  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!planData || !planData.planId) {
      console.error("Plan data or planId is missing:", planData);
      navigate("/plan");
      return;
    }

    // Fetch plan configuration details including duration
    const fetchPlanDetails = async () => {
      try {
        console.log("Fetching plan details for planId:", planData.planId); // Debug log
        const response = await axios.get(`http://localhost:8081/api/plan-configurations/${planData.planId}`);
        const planConfig = response.data;

        if (!planConfig || !planConfig.duration) {
          throw new Error("Invalid plan configuration data received");
        }

        setPlanDuration(planConfig.duration); // Update duration from database
      } catch (error) {
        console.error("Error fetching plan details:", error.response || error.message);
        setError("Failed to fetch plan details. Please try again later.");
      }
    };

    fetchPlanDetails();

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }
    fetchWalletBalance();
    return () => {
      document.body.removeChild(script);
    };
  }, [planData, navigate]);

  useEffect(() => {
    if (isUpgrade && currentPlan) {
      // Calculate remaining value of current plan
      const currentDate = new Date();
      const purchaseDate = new Date(currentPlan.purchase_date);
      const totalDays = getDurationInDays(currentPlan.duration);
      const usedDays = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, totalDays - usedDays);
      const dailyRate = currentPlan.plan_price / totalDays;
      const remainingValue = dailyRate * remainingDays;
      
      // Set upgrade discount
      setUpgradeDiscount(remainingValue);
    }
  }, [isUpgrade, currentPlan]);

  useEffect(() => {
    const calculateCombinedDuration = () => {
      if (!isUpgrade || !currentPlan || !planData?.duration) {
        setCombinedDuration(planData?.duration || "");
        return;
      }
  
      // Calculate remaining days in current plan
      const purchaseDate = new Date(currentPlan.purchase_date);
      const currentDurationDays = getDurationInDays(currentPlan.duration);
      const endDate = new Date(purchaseDate.getTime() + currentDurationDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  
      // Add remaining days to new plan duration
      const newPlanDays = getDurationInDays(planData.duration);
      const totalDays = remainingDays + newPlanDays;
  
      // Format the combined duration
      const combinedDurationStr = formatDuration(totalDays);
      setCombinedDuration(combinedDurationStr);
    };
  
    calculateCombinedDuration();
  }, [isUpgrade, currentPlan, planData]);

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/user/wallet", { withCredentials: true });
      setWalletBalance(response.data.wallet_balance);
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  };

  // Add function to validate promo code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeMessage({ type: "error", text: "Please enter a promo code" });
      return;
    }

    try {
      setValidatingPromoCode(true);
      setPromoCodeMessage(null);

      const response = await axios.post(
        "http://localhost:8081/validate-promo-code",
        {
          code: promoCode,
          planType: planData.planType,
          planId: planData.planId || planData.id,
        }
      );

      if (response.data.status === "Valid promo code") {
        setPromoCodeDiscount(response.data.discount_percentage);
        setPromoCodeMessage({
          type: "success",
          text: `${response.data.discount_percentage}% discount applied!`,
        });
      }
    } catch (err) {
      console.error("Error validating promo code:", err);
      setPromoCodeMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to validate promo code",
      });
      setPromoCodeDiscount(0);
    } finally {
      setValidatingPromoCode(false);
    }
  };

  // Add function to calculate final duration
  const calculateFinalDuration = (originalDuration, reduction) => {
    if (!reduction) return originalDuration;

    const durationMatch = originalDuration.match(/(\d+)\s+(Month|Months)/i);
    if (!durationMatch) return originalDuration;

    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2];

    let finalMonths = amount;
    if (reduction.unit === 'months') {
      finalMonths -= reduction.amount;
    } else {
      finalMonths -= Math.ceil(reduction.amount / 30);
    }

    finalMonths = Math.max(1, finalMonths); // Ensure minimum 1 month
    return `${finalMonths} ${finalMonths === 1 ? 'Month' : 'Months'}`;
  };

  // Add function to validate duration promo code
  const validateDurationPromo = async () => {
    if (!durationPromoCode.trim() || !planData?.subcategory) {
      setDurationPromoMessage({ type: "error", text: "Invalid promo code or plan type" });
      return;
    }

    try {
      setValidatingDurationPromo(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        "http://localhost:8081/validate-duration-promo",
        {
          code: durationPromoCode,
          subcategory: planData.subcategory
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      if (response.data.status === "Valid promo code") {
        setDurationReduction({
          amount: response.data.reduction_amount,
          unit: response.data.reduction_unit
        });
        
        const reducedDuration = calculateFinalDuration(planDuration, {
          amount: response.data.reduction_amount,
          unit: response.data.reduction_unit
        });

        setDurationPromoMessage({
          type: "success",
          text: `Duration reduced by ${response.data.reduction_amount} ${response.data.reduction_unit}! New duration: ${reducedDuration}`
        });
      }
    } catch (err) {
      setDurationPromoMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to validate promo code"
      });
      setDurationReduction(null);
    } finally {
      setValidatingDurationPromo(false);
    }
  };
 
  // Adjust total amount if wallet is used
  const adjustedTotalAmount = useWallet
    ? Math.max(0, totalAmount - walletBalance)
    : totalAmount;

  const handlePayment = async () => {
    if (!user || !planData?.duration) {
      alert("Invalid plan data. Please try again.");
      navigate("/plan");
      return;
    }

    try {
      setPaymentProcessing(true);
      setError(null); // Reset error state
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Convert amount to paise (multiply by 100) before sending to server
      const amountInRupees = parseFloat(adjustedTotalAmount);
      const amountInPaise = Math.round(amountInRupees * 100);

      // Create order with proper headers and amount in paise
      const orderResponse = await axios.post(
        "http://localhost:8081/create-order",
        {
          amount: amountInPaise, // Send amount in paise
          currency: "INR",
          receipt: receiptNumber,
          notes: {
            plan: planData.planName,
            planType: planData.planType,
            duration: isUpgrade ? combinedDuration : planData.duration, // Pass combined duration for upgrades
            subcategory: planData.subcategory,
            promoCode: promoCode || null,
            discount: promoCodeDiscount || 0,
            userId: user.id,
            userEmail: user.email,
            isUpgrade: isUpgrade,
            oldPlanId: isUpgrade ? currentPlan.id : null,
            upgradeDiscount: upgradeDiscountAmount
          },
          userId: user.id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      const options = {
        key: "rzp_test_1wYATSAIoY3jNF",
        amount: orderResponse.data.amount, // Amount will be in paise from server
        currency: orderResponse.data.currency,
        name: "MindStocs",
        description: `Payment for ${planData.planName} plan`,
        order_id: orderResponse.data.orderId,
        handler: async function (response) {
          try {
            console.log('Payment successful, verifying...', response);
            const verifyResponse = await axios.post(
              "http://localhost:8081/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planDetails: {
                  ...planData,
                  planPrice: discountedPrice,
                  originalPrice: planPrice,
                  promoCode,
                  promoCodeDiscount,
                  // Use reduced duration if available, otherwise use regular duration
                  duration: isUpgrade 
                    ? combinedDuration 
                    : (durationPromoMessage?.type === "success" 
                        ? durationPromoMessage.text.split('New duration:')[1].trim() 
                        : planDuration),
                  planType: planData.planType,
                  userId: user.uid,
                  durationPromoCode: durationPromoMessage?.type === "success" ? durationPromoCode : null
                }
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                withCredentials: true
              }
            );

            console.log('Verification response:', verifyResponse.data);

            if (verifyResponse.data.status === "success") {
              // Update UI
              setPaymentSuccess(true);
              setPaymentDetails({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: adjustedTotalAmount
              });

              // Navigate based on plan type
              const redirectPath = planData.planType === "Algo Software" 
                ? "/algosoft" 
                : planData.planType === "Indicator Plan" 
                  ? "/algoindi" 
                  : "/smartinvest";

              navigate(redirectPath, {
                state: {
                  planData,
                  paymentDetails: {
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    amount: adjustedTotalAmount
                  }
                }
              });
            } else {
              throw new Error(verifyResponse.data.error || "Verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed: " + (error.response?.data?.error || error.message));
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
          contact: ""
        },
        theme: {
          color: "#FFD700"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Payment initiation error:", error);
      setError(error.response?.data?.error || error.message);
      setPaymentProcessing(false);
    }
  };

  // Add upgrade display logic in the receipt body section
  const renderPlanDetails = () => (
    <div className="order-details">
      <h3>Order Details</h3>
      {isUpgrade ? (
        <>
          <div className="upgrade-details mb-4">
            <h4 className="text-warning">Plan Upgrade</h4>
            <div className="card bg-dark mb-3">
              <div className="card-body">
                <h5 className="text-warning">Current Plan</h5>
                <p>Name: {currentPlan?.plan_name}</p>
                <p>Price: ₹{currentPlan?.plan_price}</p>
                <p>Duration: {currentPlan?.duration}</p>
                <p>Remaining Days: {getRemainingDays(currentPlan)} days</p>
              </div>
            </div>
            <div className="card bg-dark">
              <div className="card-body">
                <h5 className="text-warning">New Plan</h5>
                <p>Name: {planData?.planName}</p>
                <p>Price: ₹{planPrice}</p>
                <p>Duration: {planDuration}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Regular plan purchase display
        <table className="receipt-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Details</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{planData?.planName || "Plan"}</td>
              <td>
                {planData?.planType || "Investment Plan"}
                {planData?.subcategory && (
                  <>
                    <br />
                    Category: {planData.subcategory}
                  </>
                )}
                <br />
                {isUpgrade ? (
                  <>
                    {planData?.duration}
                    <br />
                    <span className="text-success">
                      + {getDurationInDays(currentPlan?.duration || "0")} days remaining from current plan
                    </span>
                    <br />
                    <strong className="text-warning">
                      Total: {combinedDuration}
                    </strong>
                  </>
                ) : (
                  <>
                    {durationPromoMessage?.type === "success" ? (
                      <span className="text-success">
                        {durationPromoMessage.text.split('New duration:')[1] || planDuration}
                      </span>
                    ) : (
                      planDuration || "Loading..."
                    )}
                  </>
                )}
              </td>
              <td>
                {promoCodeDiscount > 0 ? (
                  <>
                    <span className="text-decoration-line-through">
                      ₹{planPrice.toFixed(2)}
                    </span>
                    <br />
                    <span className="text-success">
                      ₹{discountedPrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  `₹${planPrice.toFixed(2)}`
                )}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Subtotal</td>
              <td>₹{discountedPrice.toFixed(2)}</td>
            </tr>
            {promoCodeDiscount > 0 && (
              <tr>
                <td colSpan="2">
                  Discount ({promoCodeDiscount}% off with code:{" "}
                  {promoCode})
                </td>
                <td className="text-success">
                  -₹{discountAmount.toFixed(2)}
                </td>
              </tr>
            )}
            {isUpgrade && (
              <tr>
                <td colSpan="2">Upgrade Credit</td>
                <td className="text-success">-₹{upgradeDiscountAmount.toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td colSpan="2">Tax (18%)</td>
              <td>₹{taxAmount.toFixed(2)}</td>
            </tr>
            <tr className="total-row">
              <td colSpan="2">Total</td>
              <td>₹{adjustedTotalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      {planData?.planType === 'Algo Smart Investment' && (
        <div className="duration-promo-section mb-4">
          <h3>Duration Promo Code</h3>
          <div className="input-group">
            <input
              type="text"
              className="form-control bg-dark text-white border-warning"
              placeholder="Enter duration promo code"
              value={durationPromoCode}
              onChange={(e) => setDurationPromoCode(e.target.value)}
            />
            <button
              className="btn btn-outline-warning"
              type="button"
              onClick={validateDurationPromo}
              disabled={validatingDurationPromo}
            >
              {validatingDurationPromo ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <FaTag />
              )}
            </button>
          </div>
          {durationPromoMessage && (
            <div className={`small mt-1 text-${durationPromoMessage.type === "success" ? "success" : "danger"}`}>
              {durationPromoMessage.text}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Add helper function to calculate remaining days
  const getRemainingDays = (plan) => {
    if (!plan?.purchase_date || !plan?.duration) return 0;
    
    const purchaseDate = new Date(plan.purchase_date);
    const durationMatch = plan.duration.match(/(\d+)\s+(Day|Days|Month|Months)/i);
    if (!durationMatch) return 0;

    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    
    const endDate = new Date(purchaseDate);
    if (unit.includes('month')) {
      endDate.setMonth(endDate.getMonth() + amount);
    } else {
      endDate.setDate(endDate.getDate() + amount);
    }

    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    return remainingDays;
  };

  return (
    <div className="home">
      <Header />
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="bg-dark text-secondary px-4 py-5 text-center payment-container">
        <div className="py-5">
          <h1 className="display-5 fw-bold text-white mb-4">
            {paymentSuccess ? "Payment Successful!" : "Confirm Your Purchase"}
          </h1>

          {/* Receipt UI */}
          <div className="receipt-container mx-auto">
            <div className="receipt-header">
              <div className="company-info">
                <h2>MindStocs</h2>
                <p>Your Trusted Investment Partner</p>
              </div>
              <div className="receipt-info">
                <p>
                  <strong>Receipt:</strong> {receiptNumber}
                </p>
                <p>
                  <strong>Date:</strong> {purchaseDate}
                </p>
                {paymentSuccess && (
                  <p>
                    <strong>Payment ID:</strong> {paymentDetails?.paymentId}
                  </p>
                )}
              </div>
            </div>

            <div className="receipt-body">
              <div className="customer-info">
                <h3>Customer Details</h3>
                <p>
                  <strong>Name:</strong> {user?.displayName || "User"}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email || "N/A"}
                </p>
              </div>

              {/* Add promo code input field */}
              {!paymentSuccess && (
                <div className="promo-code-section mb-4">
                  <h3>Promo Code</h3>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-warning"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-warning"
                      type="button"
                      onClick={validatePromoCode}
                      disabled={validatingPromoCode}
                    >
                      {validatingPromoCode ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <FaTag />
                      )}
                    </button>
                  </div>
                  {promoCodeMessage && (
                    <div
                      className={`small mt-1 text-${
                        promoCodeMessage.type === "success"
                          ? "success"
                          : "danger"
                      } text-start`}
                    >
                      {promoCodeMessage.text}
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Balance Section */}
              <div className="wallet-section mb-4">
                <h3>Wallet Balance</h3>
                <p>₹{walletBalance.toFixed(2)}</p>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="useWallet"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="useWallet">
                    Use wallet balance for this payment
                  </label>
                </div>
              </div>

              {renderPlanDetails()}
            </div>

            <div className="receipt-footer">
              {paymentSuccess ? (
                <div className="payment-success">
                  <div className="success-icon">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <p>Thank you for your purchase! Your plan is now active.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="btn btn-warning btn-lg px-4 mt-3"
                  >
                    Return to Home
                  </button>
                </div>
              ) : (
                <div className="payment-actions">
                  <p className="terms">
                    By proceeding with payment, you agree to our Terms of
                    Service and Privacy Policy.
                  </p>
                  <button
                    onClick={handlePayment}
                    className="btn btn-warning btn-lg px-4 mt-3"
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Processing...
                      </>
                    ) : (
                      "Pay Now"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <LiveChat />
    </div>
  );
};

// Helper function to convert duration to days
const getDurationInDays = (duration) => {
  const match = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit.includes('day')) return amount;
  if (unit.includes('month')) return amount * 30;
  if (unit.includes('year')) return amount * 365;
  return 0;
};

// Add this helper function near getDurationInDays
const formatDuration = (totalDays) => {
  if (totalDays >= 365) {
    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    return remainingDays > 0 ? 
      `${years} Year${years > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}` :
      `${years} Year${years > 1 ? 's' : ''}`;
  }
  if (totalDays >= 30) {
    const months = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    return remainingDays > 0 ?
      `${months} Month${months > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}` :
      `${months} Month${months > 1 ? 's' : ''}`;
  }
  return `${totalDays} Day${totalDays > 1 ? 's' : ''}`;
};

export default PaymentPage;