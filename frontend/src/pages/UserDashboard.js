// frontend/src/pages/UserDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { api } from "../context/AuthContext";
import { getAuth } from "firebase/auth";
import Modal from 'react-bootstrap/Modal';
import {
  FaUserCircle,
  FaCreditCard,
  FaTicketAlt,
  FaChartLine,
  FaDownload,
  FaExchangeAlt,
  FaQuestionCircle,
  FaBars,
  FaArrowLeft,
  FaUserPlus,
  FaMoneyBill,
} from "react-icons/fa";

const calculatePlanDuration = (startDate, duration) => {
  if (!startDate || !duration) return null;

  const start = new Date(startDate);
  const durationMatch = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  
  if (!durationMatch) {
    console.error('Invalid duration format:', duration);
    return null;
  }
  
  const amount = parseInt(durationMatch[1]);
  const unit = durationMatch[2].toLowerCase();
  
  const end = new Date(start);
  if (unit.includes('month')) {
    end.setMonth(end.getMonth() + amount);
  } else if (unit.includes('year')) {
    end.setFullYear(end.getFullYear() + amount);
  } else if (unit.includes('day')) {
    end.setDate(end.getDate() + amount);
  }
  
  const now = new Date();
  const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const isExpired = remainingDays === 0;
  
  return {
    startDate: start,
    endDate: end,
    remainingDays,
    isExpired,
    totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    progressPercentage: Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
  };
};

const formatDateWithSuffix = (date) => {
  const d = new Date(date);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const day = d.getDate();
  const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day - day % 10 !== 10) * day % 10];
  
  return `${monthNames[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
};

function UserDashboard() {
  const auth = getAuth();
  const { user, refreshToken } = useAuth();  // Add refreshToken here
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [userStats, setUserStats] = useState({});
  const [userPlans, setUserPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
// At the beginning of the component, add default values

const [availablePlans, setAvailablePlans] = useState([]);
const [referralCode, setReferralCode] = useState("");
const [referralEarnings, setReferralEarnings] = useState(0);
const [referralHistory, setReferralHistory] = useState([]);

const [walletBalance, setWalletBalance] = useState(0);
const [collectiblePlans, setCollectiblePlans] = useState([]);

const [planExpiryStatus, setPlanExpiryStatus] = useState({});

const [showWithdrawForm, setShowWithdrawForm] = useState(false);
const [withdrawalHistory, setWithdrawalHistory] = useState([]);
const [withdrawalForm, setWithdrawalForm] = useState({
  amount: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  account_holder_name: '',
  remarks: ''
});

const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
const [availableUpgrades, setAvailableUpgrades] = useState([]);

// Add these helper functions after the existing utility functions
const getRemainingDays = (plan) => {
  if (!plan || !plan.purchase_date || !plan.duration) return 0;
  
  const purchaseDate = new Date(plan.purchase_date);
  const durationInDays = getDurationInDays(plan.duration);
  const endDate = new Date(purchaseDate.getTime() + durationInDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  return Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
};

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

// Add these helper functions near the top of the file with other utility functions
const getDurationInMonths = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  // Convert all durations to months
  if (unit.includes('year')) return amount * 12;
  if (unit.includes('month')) return amount;
  if (unit.includes('day')) return Math.round(amount / 30); // Convert days to approximate months
  return 0;
};

// Add this plan type mapping constant near the top of the file with other constants
const PLAN_TYPE_MAPPING = {
  'basic': 'Algo Software',
  'premium': 'Indicator Plan',
  'enterprise': 'Algo Smart Investment'
};

// Update the normalizePlanType helper function
const normalizePlanType = (planType) => {
  if (!planType) return '';
  
  const type = planType.toLowerCase().trim();
  
  if (type.includes('basic') || type.includes('algo') && type.includes('software')) 
    return PLAN_TYPE_MAPPING['basic'];
  
  if (type.includes('premium') || type.includes('indicator')) 
    return PLAN_TYPE_MAPPING['premium'];
  
  if (type.includes('enterprise') || (type.includes('smart') && type.includes('investment'))) 
    return PLAN_TYPE_MAPPING['enterprise'];
  
  return type;
};

// Update the handleUpgradeClick function to use the new normalization
// const handleUpgradeClick = async (plan) => {
//   try {
//     console.log('Current plan:', plan);

//     const response = await axios.get('http://localhost:8081/api/plan-configurations', {
//       withCredentials: true
//     });

//     const allPlans = response.data;
//     console.log('All available plans:', allPlans);
    
//     const currentDuration = getDurationInMonths(plan.duration);
//     const normalizedCurrentPlanType = normalizePlanType(plan.plan_type);
    
//     console.log('Current plan details:', {
//       planType: plan.plan_type,
//       normalizedType: normalizedCurrentPlanType,
//       duration: plan.duration,
//       durationInMonths: currentDuration
//     });
    
//     // Update the filter to handle both plan types
//     const upgrades = allPlans.filter(p => {
//       const planDuration = getDurationInMonths(p.duration);
//       const normalizedPlanType = normalizePlanType(p.plan_type);
//       const normalizedCurrentType = normalizePlanType(plan.plan_type);
      
//       const sameType = normalizedPlanType === normalizedCurrentType;
//       const differentId = p.id !== plan.id;
//       const longerDuration = planDuration > currentDuration;
//       const validPlanType = ['Algo Software', 'Indicator Plan'].includes(normalizedCurrentType);
      
//       const isEligible = sameType && differentId && longerDuration && validPlanType;

//       console.log('Checking plan:', p.plan_name, {
//         'Original plan type': p.plan_type,
//         'Normalized plan type': normalizedPlanType,
//         'Original current type': plan.plan_type,
//         'Normalized current type': normalizedCurrentType,
//         'Same type': sameType,
//         'Different ID': differentId,
//         'Plan duration': planDuration,
//         'Current duration': currentDuration,
//         'Longer duration': longerDuration,
//         'Valid plan type': validPlanType,
//         'Is eligible': isEligible
//       });

//       return isEligible;
//     });

    // console.log('Available upgrades:', upgrades);

//     if (upgrades.length === 0) {
//       alert('No upgrade options available. You are currently on the longest duration plan for this type.');
//       return;
//     }

//     // Sort upgrades by duration only
//     upgrades.sort((a, b) => getDurationInMonths(a.duration) - getDurationInMonths(b.duration));

//     // Set the necessary state for the upgrade modal
//     setSelectedPlanForUpgrade({
//       ...plan,
//       plan_name: plan.plan_name || plan.name,
//       plan_price: plan.plan_price || plan.base_price
//     });
//     setAvailableUpgrades(upgrades);
//     setUpgradeModalOpen(true);

//   } catch (error) {
//     console.error('Error fetching upgrade options:', error);
//     alert('Failed to fetch upgrade options. Please try again.');
//   }
// };

// Add this helper function near other utility functions
const calculateCumulativeDuration = (plan) => {
  if (!plan.upgraded_from || !plan.previous_duration) {
    return plan.duration;
  }
  
  const previousDays = convertDurationToDays(plan.previous_duration);
  const currentDays = convertDurationToDays(plan.duration);
  const totalDays = previousDays + currentDays;
  
  // Convert total days back to a readable duration
  if (totalDays >= 365) {
    return `${Math.floor(totalDays/365)} Year${Math.floor(totalDays/365) > 1 ? 's' : ''}`;
  } else if (totalDays >= 30) {
    return `${Math.floor(totalDays/30)} Month${Math.floor(totalDays/30) > 1 ? 's' : ''}`;
  }
  return `${totalDays} Day${totalDays > 1 ? 's' : ''}`;
};

// Update the handleUpgradePlan function
const handleUpgradePlan = async (newPlan) => {
  try {
    // Create planData object for payment
    const planData = {
      planId: newPlan.id,
      planName: newPlan.plan_name,
      planPrice: newPlan.base_price,
      realPrice: newPlan.real_price || newPlan.base_price,
      duration: newPlan.duration,
      planType: normalizePlanType(newPlan.plan_type),
      oldPlanId: selectedPlanForUpgrade.id,
      previousDuration: selectedPlanForUpgrade.duration,
      isUpgrade: true
    };

    // Close the upgrade modal
    setUpgradeModalOpen(false);

    // Navigate to payment page with plan data
    navigate('/payment', { 
      state: { 
        planData,
        isUpgrade: true,
        currentPlan: selectedPlanForUpgrade
      }
    });
  } catch (error) {
    console.error('Error initiating upgrade:', error);
    alert(error.response?.data?.error || 'Failed to initiate upgrade. Please try again.');
  }
};

// Add upgrade modal component
const UpgradeModal = () => (
  <Modal show={upgradeModalOpen} onHide={() => setUpgradeModalOpen(false)}>
    <Modal.Header closeButton className="bg-dark text-white border-warning">
      <Modal.Title>Upgrade Your Plan</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-dark text-white">
      <div className="current-plan mb-4">
        <h6 className="text-warning">Current Plan</h6>
        <div className="card bg-dark border-secondary">
          <div className="card-body">
            <h6>{selectedPlanForUpgrade?.plan_name}</h6>
            <p className="mb-1">Duration: {selectedPlanForUpgrade?.duration}</p>
            <p className="mb-0">Price: ₹{selectedPlanForUpgrade?.plan_price}</p>
          </div>
        </div>
      </div>
      
      <h6 className="text-warning mb-3">Available Upgrades</h6>
      {availableUpgrades.map(plan => (
        <div key={plan.id} className="card bg-dark border-warning mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="text-warning">{plan.plan_name}</h6>
                <p className="mb-1">Duration: {plan.duration}</p>
                <p className="mb-0">Price: ₹{plan.base_price}</p>
              </div>
              <button 
                className="btn btn-warning"
                onClick={() => handleUpgradePlan(plan)} // Pass the full plan object
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </Modal.Body>
  </Modal>
);

// Helper function to convert duration to days
function convertDurationToDays(duration) {
  const match = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit.includes('day')) return amount;
  if (unit.includes('month')) return amount * 30;
  if (unit.includes('year')) return amount * 365;
  return 0;
}

// Add this after other utility functions
const getDurationInDays = (duration) => {
  if (!duration) return 0;
  
  const match = duration.match(/(\d+)\s+(Day|Days|Month|Months|Year|Years)/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit.includes('day')) return amount;
  if (unit.includes('month')) return amount * 30; // Convert months to days
  if (unit.includes('year')) return amount * 365; // Convert years to days
  return 0;
};

// Add these helper functions near the top with other utility functions
const getPlanStatus = (plan) => {
  const upgradablePlanTypes = ['Algo Software', 'Indicator Plan'];
  const isUpgradablePlan = upgradablePlanTypes.includes(plan.plan_type);

  if (plan.is_upgraded) {
    return { 
      status: 'Upgraded Plan', 
      class: 'success',
      badge: 'success',
      isActive: true,
      canUpgrade: false
    };
  }
  if (plan.upgraded_to) {
    return { 
      status: 'Expired (Upgraded)', 
      class: 'secondary',
      badge: 'secondary',
      isActive: false,
      canUpgrade: false
    };
  }
  return { 
    status: 'Active', 
    class: 'primary',
    badge: 'primary',
    isActive: true,
    canUpgrade: isUpgradablePlan
  };
};

// Add new helper function for Income Flow Builder
const calculateIncomeFlowReturns = (plan) => {
  if (plan.plan_type !== "Algo Smart Investment" || plan.subcategory !== "Income Flow Builder") return null;
  
  const planPrice = parseFloat(plan.plan_price);
  const totalReturn = planPrice * 2; // 2x return
  const durationInMonths = getDurationInMonths(plan.duration);
  const monthlyReturn = totalReturn / durationInMonths;
  
  return {
    monthlyAmount: monthlyReturn,
    totalMonths: durationInMonths,
    totalReturn: totalReturn
  };
};

// Add helper for checking monthly collection eligibility
const getMonthlyCollectionStatus = (plan) => {
  if (!plan) return null;

  const lastCollection = plan.last_collection_date ? new Date(plan.last_collection_date) : new Date(plan.purchase_date);
  const now = new Date();
  
  // Calculate full months passed since last collection or purchase
  const monthsPassed = (now.getFullYear() - lastCollection.getFullYear()) * 12 + 
                      (now.getMonth() - lastCollection.getMonth());
  
  // Only allow collection if at least one full month has passed
  const canCollect = monthsPassed >= 1;
  
  // Calculate when next collection will be available
  const nextCollection = new Date(lastCollection);
  nextCollection.setMonth(nextCollection.getMonth() + 1);

  return {
    canCollect,
    monthsCollected: plan.months_collected || 0,
    totalMonths: getDurationInMonths(plan.duration),
    monthsRemaining: getDurationInMonths(plan.duration) - (plan.months_collected || 0),
    nextCollectionDate: nextCollection,
    monthsPassed
  };
};

  // Support ticket form
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });

  // Plan upgrade selection

  const [selectedPlan, setSelectedPlan] = useState(null);

const [copySuccess, setCopySuccess] = useState(false);

useEffect(() => {
  if (!user) {
    navigate("/login");
    return;
  }

  // Check if the user has a valid session
  const checkSession = async () => {
    try {
      // This will refresh the session if needed
      await api.post("http://localhost:8081/firebase-auth", {
        uid: user.id,
        email: user.email,
        displayName: user.displayName || user.username,
        emailVerified: user.emailVerified,
        provider: user.providerId || 'email'
      }, { withCredentials: true });
      
      // If successful, fetch user data
      fetchUserData();
    } catch (err) {
      console.error("Session check failed:", err);
      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please log in again.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError("Failed to authenticate with the server. Please try again later.");
      }
      setLoading(false);
    }
  };

  checkSession();
}, [user, navigate]);
 // In your fetchUserData function, let's add a token refresh mechanism
 const fetchUserData = async () => {
  setLoading(true);
  setError(null);

  try {
    // First, check if the user is authenticated with the backend
    await api.post("/firebase-auth", {
      uid: user.id,
      email: user.email,
      displayName: user.displayName || user.username,
      emailVerified: user.emailVerified,
      provider: user.providerId || 'email'
    });

    // Then fetch all required data in parallel
    const [statsRes, plansRes, invoicesRes, availablePlansRes, referralRes] = await Promise.all([
      api.get("/api/user/stats"),
      api.get("/api/user/plans"),  // Note: Fixed the capitalization here
      api.get("/api/user/invoices"),
      api.get("/api/plan-configurations"),
      api.get("/api/user/referrals"),
    ]);

    // Set user stats
    setUserStats(statsRes.data);
    
    // Set user plans
    setUserPlans(plansRes.data);
    
    // Set invoices
    setInvoices(invoicesRes.data);
    
    // Set support tickets (empty array for now)
    setSupportTickets([]);
    
    // Set available plans
    setAvailablePlans(availablePlansRes.data);
    
    // Set referral data
    setReferralCode(referralRes.data.referralCode || `REF${user.id}${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    setReferralEarnings(referralRes.data.totalEarnings || 0);
    setReferralHistory(referralRes.data.history || []);
    
  } catch (err) {
    console.error("Error fetching user data:", err);
    
    if (err.response && err.response.status === 401) {
      // Try to refresh the token
      try {
        await refreshToken();
        // Try fetching data again
        fetchUserData();
        return;
      } catch (refreshError) {
        // If token refresh fails, redirect to login
        setError("Your session has expired. Please log in again.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } else if (err.response) {
      setError(`Server error (${err.response.status}): ${err.response.data.error || 'Failed to load dashboard data'}`);
    } else if (err.request) {
      setError("Network error: Could not connect to the server. Please check your internet connection.");
    } else {
      setError(`Error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};

const copyReferralLink = () => {
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  navigator.clipboard.writeText(referralLink)
    .then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};


  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when selecting a tab on mobile
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Handle ticket form submission
  // Update the handleTicketSubmit function in UserDashboard.js

const handleTicketSubmit = async (e) => {
  e.preventDefault();

  try {
    await api.post(
      "http://localhost:8081/api/user/support-tickets",
      newTicket,
      { 
        withCredentials: true,
      }
    );

    // Reset form and refresh data
    setNewTicket({
      subject: "",
      message: "",
      priority: "medium",
    });

    // Show success message
    setError(null);
    alert("Support ticket submitted successfully!");
  } catch (err) {
    setError(
      "Failed to submit support ticket. " +
        (err.response?.data?.error || err.message)
    );
  }
};

  // Handle ticket form input changes
  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setNewTicket({
      ...newTicket,
      [name]: value,
    });
  };

// Calculate current balance based on user plans
const calculateCurrentBalance = (plans) => {
  if (!plans || plans.length === 0) return referralEarnings;
  
  // Sum up the total invested amount from all plans
  const plansTotal = plans.reduce((total, plan) => {
    const planPrice = parseFloat(plan.plan_price) || 0;
    return total + planPrice;
  }, 0);
  
  // Add referral earnings to the total
  return plansTotal + referralEarnings;
};


// Update the calculateDailyAddition function
const calculateDailyAddition = (plans) => {
  if (!plans || plans.length === 0) return 0;
  
  return plans.reduce((total, plan) => {
    const planPrice = parseFloat(plan.plan_price) || 0;
    let dailyRate = 0;
    
    // Different profit rates based on plan type
    if (plan.plan_type === "Algo Software") {
      dailyRate = 0.0015; // 0.15% daily
    } else if (plan.plan_type === "Indicator Plan") {
      dailyRate = 0.002; // 0.2% daily
    } else if (plan.plan_type === "Algo Smart Investment") {
      // Calculate daily rate to achieve 2x return over the plan duration
      const durationDays = getDurationInDays(plan.duration);
      dailyRate = 2 / durationDays; // This will result in 2x total return
    }
    
    return total + (planPrice * dailyRate);
  }, 0);
};

// Calculate final balance at the end of the plan period
const calculateFinalBalance = (plans) => {
  if (!plans || plans.length === 0) return 0;
  
  const currentBalance = calculateCurrentBalance(plans);
  const dailyAddition = calculateDailyAddition(plans);
  
  // Get the plan with the longest duration
  const longestPlan = plans.reduce((longest, plan) => {
    const planDuration = extractDurationInDays(plan.duration);
    const longestDuration = longest ? extractDurationInDays(longest.duration) : 0;
    return planDuration > longestDuration ? plan : longest;
  }, null);
  
  if (!longestPlan) return currentBalance;
  
  // Calculate remaining days in the plan
  const purchaseDate = new Date(longestPlan.purchase_date);
  const durationDays = extractDurationInDays(longestPlan.duration);
  const endDate = new Date(purchaseDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  const today = new Date();
  const remainingDays = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
  
  // Calculate final balance
  return currentBalance + (dailyAddition * remainingDays);
};

// Extract duration in days from duration string
const extractDurationInDays = (durationStr) => {
  if (!durationStr) return 0;
  
  // Parse duration like "18 Months" to days
  const parts = durationStr.split(' ');
  if (parts.length !== 2) return 0;
  
  const value = parseInt(parts[0]);
  const unit = parts[1].toLowerCase();
  
  if (unit.includes('month')) {
    return value * 30; // Approximate months to days
  } else if (unit.includes('day')) {
    return value;
  } else if (unit.includes('year')) {
    return value * 365; // Approximate years to days
  }
  
  return 0;
};

// Calculate maturity date (when the plan ends)
const calculateMaturityDate = (plans) => {
  if (!plans || plans.length === 0) return 'N/A';
  
  // Get the plan with the longest duration
  const longestPlan = plans.reduce((longest, plan) => {
    const planDuration = extractDurationInDays(plan.duration);
    const longestDuration = longest ? extractDurationInDays(longest.duration) : 0;
    return planDuration > longestDuration ? plan : longest;
  }, null);
  
  if (!longestPlan) return 'N/A';
  
  // Calculate end date
  const purchaseDate = new Date(longestPlan.purchase_date);
  const durationDays = extractDurationInDays(longestPlan.duration);
  const endDate = new Date(purchaseDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  // Format date as MM/DD/YYYY
  return endDate.toLocaleDateString();
};

// Calculate progress percentage
const calculateProgressPercentage = (plans) => {
  if (!plans || plans.length === 0) return 0;
  
  // Get the plan with the longest duration
  const longestPlan = plans.reduce((longest, plan) => {
    const planDuration = extractDurationInDays(plan.duration);
    const longestDuration = longest ? extractDurationInDays(longest.duration) : 0;
    return planDuration > longestDuration ? plan : longest;
  }, null);
  
  if (!longestPlan) return 0;
  
  // Calculate progress
  const purchaseDate = new Date(longestPlan.purchase_date);
  const durationDays = extractDurationInDays(longestPlan.duration);
  const endDate = new Date(purchaseDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  const today = new Date();
  const totalDuration = endDate - purchaseDate;
  const elapsed = today - purchaseDate;
  
  // Calculate percentage with bounds checking
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  return percentage;
};

// Add helper function to calculate days since purchase
const getDaysSincePurchase = (purchaseDate) => {
  if (!purchaseDate) return 0;
  const purchase = new Date(purchaseDate);
  const now = new Date();
  return Math.floor((now - purchase) / (1000 * 60 * 60 * 24));
};

  // Handle downloading invoice
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(
        `http://localhost:8081/api/user/invoices/${invoiceId}/download`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
  
      // Create a download link and click it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(
        "Failed to download invoice. " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  useEffect(() => {
    const checkPlanExpiry = async () => {
        try {
            const response = await axios.get('http://localhost:8081/api/user/check-plan-expiry', {
                withCredentials: true
            });
            setUserPlans(response.data);
        } catch (err) {
            console.error('Error checking plan expiry:', err);
        }
    };

    if (user) {
        checkPlanExpiry();
    }
}, [user]);
 
const handleWithdrawSubmit = async (e) => {
  e.preventDefault();
  try {
    if (parseFloat(withdrawalForm.amount) > walletBalance) {
      alert('Withdrawal amount cannot exceed wallet balance');
      return;
    }

    await api.post('/api/user/withdrawals', withdrawalForm);
    alert('Withdrawal request submitted successfully!');
    setShowWithdrawForm(false);
    // Reset form
    setWithdrawalForm({
      amount: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      account_holder_name: '',
      remarks: ''
    });
    // Refresh withdrawal history
    fetchWithdrawalHistory();
    // Refresh wallet balance
    fetchWalletAndCollectibles();
  } catch (err) {
    console.error('Error submitting withdrawal request:', err);
    alert('Failed to submit withdrawal request. Please try again.');
  }
};
 
// Replace the existing fetchWalletAndCollectibles function
const fetchWalletAndCollectibles = async () => {
  try {
    console.log('Fetching wallet balance...');
    const response = await api.get('/api/user/wallet');
    
    if (response.data && typeof response.data.balance === 'number') {
      const balance = response.data.balance;
      setWalletBalance(balance);
      console.log('Wallet balance updated:', balance);
    } else {
      console.warn('Invalid wallet data received:', response.data);
      setWalletBalance(0);
    }
  } catch (err) {
    console.error('Failed to fetch wallet balance:', err);
    setError('Failed to load wallet balance. Please try again later.');
    setWalletBalance(0);
  }
};

// Add this after state declarations
const fetchWithdrawalHistory = async () => {
  try {
    const response = await api.get('/api/user/withdrawals');
    setWithdrawalHistory(response.data);
  } catch (err) {
    console.error('Error fetching withdrawal history:', err);
    setError('Failed to fetch withdrawal history. Please try again later.');
  }
};

// Add fetchWithdrawalHistory to the dependencies array of the useEffect that runs when user changes
useEffect(() => {
  if (user) {
    fetchWalletAndCollectibles();
    fetchWithdrawalHistory(); // Add this line
  }
}, [user]);

// Add this useEffect hook right after your state declarations
useEffect(() => {
  if (user) {
    fetchWalletAndCollectibles();
  }
}, [user]);

const fetchPlanExpiryStatus = async () => {
  try {
    const response = await axios.get('http://localhost:8081/api/plans/expiry-status', {
      withCredentials: true
    });
    setPlanExpiryStatus(response.data.reduce((acc, plan) => {
      acc[plan.id] = plan;
      return acc;
    }, {}));
  } catch (err) {
    console.error('Error fetching plan expiry status:', err);
  }
};

useEffect(() => {
  fetchPlanExpiryStatus();
}, []);

const handleCollectPlan = async (planId, planType, collectionType = 'full') => {
  try {
    const response = await api.post('/api/plans/collect', {
      planId,
      planType,
      collectionType
    });
    
    // Update the specific plan in the userPlans state with the new data
    setUserPlans(prevPlans => prevPlans.map(plan => 
      plan.id === planId ? { ...plan, ...response.data.plan } : plan
    ));
    
    // Update wallet balance
    setWalletBalance(prev => prev + response.data.collected_amount);
    
    // Show success message
    alert(`Successfully collected ₹${response.data.collected_amount.toFixed(2)}. Amount added to your wallet.`);
    
  } catch (err) {
    console.error('Error collecting plan:', err);
    setError(err.response?.data?.error || 'Failed to collect plan. Please try again.');
  }
};

// Update the formatDate function to handle MySQL datetime strings
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (date instanceof Date && !isNaN(date)) {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }
    return 'N/A';
  } catch (err) {
    console.error('Date parsing error:', err);
    return 'N/A';
  }
};

const renderUpgradedPlans = (upgradedPlans) => (
  <div className="mt-5">
    <h5 className="text-warning">Upgraded Plans</h5>
    {upgradedPlans.length > 0 ? (
      <div className="table-responsive">
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Old Plan</th>
              <th>Old Price</th>
              <th>New Plan</th>
              <th>New Price</th>
              <th>Upgrade Date</th>
            </tr>
          </thead>
          <tbody>
            {upgradedPlans.map((plan, index) => (
              <tr key={index}>
                <td>{plan.old_plan_name}</td>
                <td>₹{plan.old_plan_price}</td>
                <td>{plan.new_plan_name}</td>
                <td>₹{plan.new_plan_price}</td>
                <td>{formatDate(plan.upgrade_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-muted">No upgraded plans found.</p>
    )}
  </div>
);

const [upgradedPlans, setUpgradedPlans] = useState([]);

// Fetch upgraded plans
useEffect(() => {
  if (user) {
    // Move fetchUpgradedPlans function inside useEffect
    const fetchUpgradedPlans = async () => {
      try {
        const response = await fetch('/api/user/plans', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch upgraded plans');
        }

        const plans = await response.json();
        const upgrades = plans.filter(plan => plan.is_upgraded);
        setUpgradedPlans(upgrades);
      } catch (error) {
        console.error('Error fetching upgraded plans:', error);
      }
    };

    fetchUpgradedPlans();
  }
}, [user]); // Now we only depend on user

const handleUpgradeClick = async (currentPlan) => {
  try {
    // Fetch available upgrades
    const response = await axios.get(
      `http://localhost:8081/api/plan-configurations?type=${currentPlan.plan_type}`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }
    );

    const availableUpgrades = response.data.filter(plan => 
      parseFloat(plan.base_price) > parseFloat(currentPlan.plan_price)
    );

    // Navigate to plan selection with upgrade context
    navigate('/plan', { 
      state: { 
        isUpgrade: true, 
        currentPlan,
        availableUpgrades
      }
    });
  } catch (error) {
    console.error('Error fetching upgrade options:', error);
    // Handle error appropriately
  }
};

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mt-5 pt-5 text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white">Loading your dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="UserDashboard">
      <Header />
      <div className="container-fluid mt-5 pt-4">
        {/* Mobile Sidebar Toggle Button */}
        <button
          className="btn btn-warning d-md-none mb-3 position-fixed start-0 ms-2 z-index-1030"
          onClick={toggleSidebar}
          style={{ top: "70px", zIndex: 1030 }}
        >
          {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
        </button>

        <div className="row">
          {/* Sidebar */}
          <div
            className={`sidebar col-md-3 col-lg-2 bg-dark d-${
              sidebarOpen ? "block" : "none"
            } d-md-block position-fixed h-100 border-end border-3 border-warning shadow-lg`}
            style={{ zIndex: 1029, overflowY: "auto", top: "56px" }}
          >
            <div className="position-sticky pt-3">
              <div className="text-center mb-4">
                <FaUserCircle size={64} className="text-warning mb-2" />
                <h5 className="text-white">{user?.username || "User"}</h5>
                <p className="text-muted small">{user?.email}</p>
              </div>

              <ul className="nav flex-column">
                <li className="nav-item">
                  <button
                    className={`nav-link btn ${
                      activeTab === "overview" ? "text-warning" : "text-white"
                    }`}
                    onClick={() => handleTabClick("overview")}
                  >
                    <FaChartLine className="me-2" />
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn ${
                      activeTab === "Plans"
                        ? "text-warning"
                        : "text-white"
                    }`}
                    onClick={() => handleTabClick("Plans")}
                  >
                    <FaCreditCard className="me-2" />
                    Plans
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn ${
                      activeTab === "billing" ? "text-warning" : "text-white"
                    }`}
                    onClick={() => handleTabClick("billing")}
                  >
                    <FaDownload className="me-2" />
                    Billing History
                  </button>
                </li>
              
<li className="nav-item">
  <button
    className={`nav-link btn ${
      activeTab === "referrals" ? "text-warning" : "text-white"
    }`}
    onClick={() => handleTabClick("referrals")}
  >
    <FaUserPlus className="me-2" />
    Referrals
  </button>
</li>
<li className="nav-item">
  <button
    className={`nav-link btn ${activeTab === "withdrawals" ? "text-warning" : "text-white"}`}
    onClick={() => handleTabClick("withdrawals")}
  >
    <FaMoneyBill className="me-2" />
    Withdrawal History
  </button>
</li>

                <li className="nav-item">
                  <button
                    className={`nav-link btn ${
                      activeTab === "support" ? "text-warning" : "text-white"
                    }`}
                    onClick={() => handleTabClick("support")}
                  >
                    <FaQuestionCircle className="me-2" />
                    Support
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Main content - adjust margins based on sidebar visibility */}
          <main
            class={`col-12 ${
              sidebarOpen ? "ps-0" : ""
            } col-md-9 col-lg-10 ms-auto px-md-4 bg-dark text-white`}
          >
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="card bg-dark text-white border-warning mb-4">
                  <div className="card-header border-warning d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0 text-warning">
                      <i className="bi bi-wallet2"></i> Wallet Balance
                    </h5>
                    <button 
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => setShowWithdrawForm(true)}
                    >
                      Withdraw Funds
                    </button>
                  </div>
                  <div className="card-body">
                    <h3 className="text-warning">₹{walletBalance.toFixed(2)}</h3>
                    <p className="text-muted mb-0 small">Minimum withdrawal: ₹1</p>
                  </div>
                </div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Dashboard Overview</h1>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={fetchUserData}
                  >
                    Refresh Data
                  </button>
                </div>

                {/* Overview Cards */}
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-4">
                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          Current Plan
                        </h5>
                        <p className="card-text display-6">
                          {userPlans[0]?.plan_name || "No Plan"}
                        </p>
                        <p className="card-text text-muted">
                          {userPlans[0]
                            ? `Expires: ${new Date(
                                userPlans[0].expiry_date
                              ).toLocaleDateString()}`
                            : "Not Subscribed"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">Plan Date</h5>
                        <div className="mt-2">
                          <small>
                            Date: {userStats.storage_used || 0} /{" "}
                            {userStats.storage_limit || 0} Days
                          </small>
                          <div className="progress" style={{ height: "5px" }}>
                            <div
                              className="progress-bar bg-warning"
                              style={{
                                width: `${
                                  ((userStats.api_calls || 0) /
                                    (userStats.api_limit || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">Withdraw</h5>
                        <p className="card-text display-6">
                          ${userPlans[0]?.base_price || "0"}
                        </p>
                        <p className="card-text text-muted">
                          Next billing:{" "}
                          {userPlans[0]
                            ? new Date(
                                userPlans[0].next_billing_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">Reference</h5>
                        <p className="card-text display-6">
                          ${userPlans[0]?.base_price || "0"}
                        </p>
                        <p className="card-text text-muted">
                          Next billing:{" "}
                          {userPlans[0]
                            ? new Date(
                                userPlans[0].next_billing_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">Withdraw</h5>
                        <button 
                          className="btn btn-outline-warning w-100 mb-2"
                          onClick={() => setShowWithdrawForm(true)}
                        >
                          Withdraw Funds
                        </button>
                        <p className="card-text text-muted small">
                          Min. withdrawal: ₹1
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <h3 className="text-warning">Recent Withdrawals</h3>
                    <div className="table-responsive">
                      <table className="table table-dark table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.slice(0, 3).map((invoice) => (
                            <tr key={invoice.id}>
                              <td>
                                {new Date(invoice.date).toLocaleDateString()}
                              </td>
                              <td>${invoice.amount}</td>
                              <td>
                                <span
                                  className={`badge bg-${
                                    invoice.status === "paid"
                                      ? "success"
                                      : "warning"
                                  }`}
                                >
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {invoices.length === 0 && (
                            <tr>
                              <td colSpan="3" className="text-center">
                                No recent invoices
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-md-6 mb-4">
                    <h3 className="text-warning">Recent References</h3>
                    <div className="table-responsive">
                      <table className="table table-dark table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supportTickets.slice(0, 3).map((ticket) => (
                            <tr key={ticket.id}>
                              <td>
                                {new Date(ticket.date).toLocaleDateString()}
                              </td>
                              <td>{ticket.subject}</td>
                              <td>
                                <span
                                  className={`badge bg-${
                                    ticket.status === "open"
                                      ? "warning"
                                      : ticket.status === "resolved"
                                      ? "success"
                                      : "info"
                                  }`}
                                >
                                  {ticket.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {supportTickets.length === 0 && (
                            <tr>
                              <td colSpan="3" className="text-center">
                                No support tickets
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}


{/* Wallet Balance Section */}
<div className="row mt-4 mb-4">
  <div className="col-12">
    <div className="card bg-dark text-white border-warning">
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">Investment Wallet</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="card bg-dark border-secondary h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-3">Current Balance</h6>
                <h3 className="text-warning mb-0">
                  ${calculateCurrentBalance(userPlans).toFixed(2)}
                </h3>
                <p className="text-muted mt-2 mb-0">Invested Amount</p>
              </div>
            </div>
          </div>
        
<div className="col-md-4 mb-3">
  <div className="card bg-dark border-secondary h-100">
    <div className="card-body text-center">
      <h6 className="text-muted mb-3">Referral Earnings</h6>
      <h3 className="text-info mb-0">
        ${referralEarnings.toFixed(2)}
      </h3>
      <p className="text-muted mt-2 mb-0">Earned from referrals</p>
    </div>
  </div>
</div>

          <div className="col-md-4 mb-3">
            <div className="card bg-dark border-secondary h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-3">Daily Addition</h6>
                <h3 className="text-success mb-0">
                  +${calculateDailyAddition(userPlans).toFixed(2)}
                </h3>
                <p className="text-muted mt-2 mb-0">Added to your balance daily</p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <div className="card bg-dark border-secondary h-100">
              <div className="card-body text-center">
                <h6 className="text-muted mb-3">Final Balance</h6>
                <h3 className="text-warning mb-0">
                  ${calculateFinalBalance(userPlans).toFixed(2)}
                </h3>
                <p className="text-muted mt-2 mb-0">
                  Estimated on {calculateMaturityDate(userPlans)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="d-flex justify-content-between mb-1">
            <span>Investment Progress</span>
            <span>{calculateProgressPercentage(userPlans)}% Complete</span>
          </div>
          <div className="progress" style={{ height: "10px" }}>
            <div 
              className="progress-bar bg-warning" 
              role="progressbar" 
              style={{ width: `${calculateProgressPercentage(userPlans)}%` }}
              aria-valuenow={calculateProgressPercentage(userPlans)} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

            {/* Plans Tab */}
    {activeTab === "Plans" && (
  <div>
    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
      <h1 className="h2 text-warning">Your Investment Plans</h1>
    </div>

    {userPlans.length > 0 ? (
      <div className="row g-4">
        {userPlans.map((plan) => {
          const duration = calculatePlanDuration(plan.purchase_date, plan.duration);
          const planStatus = getPlanStatus(plan);
          const totalDuration = plan.is_upgraded ? calculateCumulativeDuration(plan) : plan.duration;
          
          return (
            <div key={plan.id} className="col-12">
              <div className={`card bg-dark border-warning ${!planStatus.isActive ? 'opacity-75' : ''}`}>
                <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0 d-flex align-items-center">
                      {plan.plan_name}
                      <span className={`badge bg-${planStatus.badge} ms-2`}>
                        {planStatus.status}
                      </span>
                    </h5>
                    <small className="text-dark">
                      {plan.plan_type} • {totalDuration}
                      {plan.is_upgraded && plan.previous_duration && (
                        <span className="text-dark ms-2">
                          (Including {plan.previous_duration} from previous plan)
                        </span>
                      )}
                    </small>
                  </div>
                  <div className="text-end">
                    <h6 className="mb-0">Investment</h6>
                    <strong>₹{plan.plan_price}</strong>
                  </div>
                </div>

                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <h6 className="text-warning mb-3">Investment Returns</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-dark mb-0">
                          {plan.plan_type === "Algo Smart Investment" && plan.subcategory === "Profit Split" ? (
                            <tbody>
                              <tr>
                                <td>First Collection (50%):</td>
                                <td className="text-success text-end">
                                  +₹{(plan.plan_price).toFixed(2)}
                                  <br/>
                                  <small className="text-muted">
                                    (After {getDurationInDays(plan.duration)/2} days)
                                  </small>
                                </td>
                              </tr>
                              <tr>
                                <td>Final Collection (50%):</td>
                                <td className="text-success text-end">
                                  +₹{(plan.plan_price).toFixed(2)}
                                  <br/>
                                  <small className="text-muted">
                                    (After {getDurationInDays(plan.duration)} days)
                                  </small>
                                </td>
                              </tr>
                              <tr>
                                <td>Total Returns:</td>
                                <td className="text-warning text-end">
                                  ₹{(plan.plan_price * 2).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          ) : (
                            <tbody>
                              <tr>
                                <td>Daily Returns:</td>
                                <td className="text-success text-end">
                                  {plan.plan_type === "Algo Smart Investment" ? (
                                    <>+₹{((plan.plan_price * 2) / getDurationInDays(plan.duration)).toFixed(2)}</>
                                  ) : (
                                    <>+₹{(plan.plan_price * (plan.plan_type === "Algo Software" ? 0.002 : 0.002)).toFixed(2)}</>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td>Monthly Returns:</td>
                                <td className="text-success text-end">
                                  {plan.plan_type === "Algo Smart Investment" ? (
                                    <>+₹{((plan.plan_price * 2 * 30) / getDurationInDays(plan.duration)).toFixed(2)}</>
                                  ) : (
                                    <>+₹{(plan.plan_price * (plan.plan_type === "Algo Software" ? 0.002 : 0.002) * 30).toFixed(2)}</>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td>Total Returns:</td>
                                <td className="text-warning text-end">
                                  {plan.plan_type === "Algo Smart Investment" ? (
                                    <>₹{(plan.plan_price * 2).toFixed(2)}</>
                                  ) : (
                                    <>₹{(plan.plan_price * (plan.plan_type === "Algo Software" ? 0.002 : 0.002) * getDurationInDays(plan.duration)).toFixed(2)}</>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          )}
                          {plan.plan_type === "Algo Smart Investment" && plan.subcategory === "Income Flow Builder" && (
  <tbody>
    <tr>
      <td>Monthly Returns:</td>
      <td className="text-success text-end">
        +₹{(calculateIncomeFlowReturns(plan)?.monthlyAmount || 0).toFixed(2)}
      </td>
    </tr>
    <tr>
      <td>Months Collected:</td>
      <td className="text-info text-end">
        {plan.months_collected || 0} / {getDurationInMonths(plan.duration)}
      </td>
    </tr>
    <tr>
      <td>Total Returns:</td>
      <td className="text-warning text-end">
        ₹{(plan.plan_price * 2).toFixed(2)}
      </td>
    </tr>
  </tbody>
)}
                        </table>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <h6 className="text-warning mb-3">Plan Timeline</h6>
                      <div className="bg-dark rounded p-3 border border-secondary">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Start Date:</span>
                          <span>{formatDateWithSuffix(plan.purchase_date)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>End Date:</span>
                          <span>{formatDateWithSuffix(duration?.endDate)}</span>
                        </div>
                        {!planStatus.isActive && (
                          <div className="mt-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-warning">Progress</span>
                              <span>
                                {duration?.remainingDays} days remaining
                              </span>
                            </div>
                            <div className="progress" style={{ height: "8px" }}>
                              <div
                                className="progress-bar bg-warning"
                                style={{ width: `${duration?.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <h6 className="text-warning mb-3">Actions</h6>
                      <div className="d-grid gap-2">
                        {planStatus.isActive && planStatus.canUpgrade && !plan.is_upgraded && (
                          <button
                            className="btn btn-warning"
                            onClick={() => handleUpgradeClick(plan)}
                          >
                            <FaExchangeAlt className="me-2" />
                            Upgrade Plan
                          </button>
                        )}
                        {planStatus.isActive && plan.plan_type === "Algo Smart Investment" && 
                         plan.subcategory === "Profit Split" && (
                          <>
                            {!plan.first_collection_made && 
                             getDaysSincePurchase(plan.purchase_date) >= getDurationInDays(plan.duration)/2 && (
                              <button
                                className="btn btn-success"
                                onClick={() => handleCollectPlan(plan.id, plan.plan_type, 'half')}
                              >
                                Collect First 50% Returns
                              </button>
                            )}
                            {plan.first_collection_made && 
                             !plan.final_collection_made && 
                             getDaysSincePurchase(plan.purchase_date) >= getDurationInDays(plan.duration) && (
                              <button
                                className="btn btn-success"
                                onClick={() => handleCollectPlan(plan.id, plan.plan_type, 'final')}
                              >
                                Collect Final 50% Returns
                              </button>
                            )}
                            {plan.first_collection_made && plan.final_collection_made && (
                              <div className="alert alert-success mb-0">
                                All returns collected successfully
                              </div>
                            )}
                          </>
                        )}
                        {plan.plan_type === "Algo Smart Investment" && plan.subcategory === "Income Flow Builder" && (
  <>
    {(() => {
      const status = getMonthlyCollectionStatus(plan);
      if (!status) return null;

      if (status.monthsCollected >= status.totalMonths) {
        return (
          <div className="alert alert-success mb-0">
            Plan completed! All monthly returns collected.
          </div>
        );
      }
      
      return status.canCollect ? (
        <button
          className="btn btn-success"
          onClick={() => handleCollectPlan(plan.id, plan.plan_type, 'monthly')}
        >
          Collect Monthly Return
          <span className="badge bg-light text-dark ms-2">
            Month {status.monthsCollected + 1} of {status.totalMonths}
          </span>
        </button>
      ) : (
        <div className="alert alert-info mb-0">
          Next collection available on: {formatDate(status.nextCollectionDate)}
          <br/>
          {status.monthsRemaining} months remaining
          <br/>
          <small className="text-muted">
            (Each month must complete fully before collection)
          </small>
        </div>
      );
    })()}
  </>
)}
                        {duration?.remainingDays === 0 && !plan.is_collected && planStatus.isActive && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleCollectPlan(plan.id, plan.plan_type)}
                          >
                            Collect Returns
                          </button>
                        )}
                        {plan.is_collected && (
                          <div className="alert alert-success mb-0">
                            Returns collected successfully
                          </div>
                        )}
                        {!planStatus.isActive && (
                          <div className="alert alert-secondary mb-0">
                            This plan has been upgraded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {plan.features && (
                    <div className="mt-4">
                      <h6 className="text-warning mb-3">Plan Features</h6>
                      <div className="row row-cols-2 row-cols-md-4 g-3">
                        {Object.entries(JSON.parse(plan.features)).map(([key, value]) => (
                          <div className="col" key={key}>
                            <div className="card bg-dark border-secondary h-100">
                              <div className="card-body p-2">
                                <h6 className="text-warning text-capitalize mb-1">{key}</h6>
                                <small className="text-white">{value}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center p-5">
        <FaCreditCard size={48} className="text-warning mb-3" />
        <h4>No Active Plans</h4>
        <p className="text-muted">You don't have any active investment plans.</p>
        <button
          className="btn btn-warning mt-3"
          onClick={() => navigate("/plan")}
        >
          View Available Plans
        </button>
      </div>
    )}

    {/* Upgrade Plan History Section */}
    <div className="mt-5">
      <h3 className="text-warning">Upgrade Plan History</h3>
      {userPlans.some(plan => plan.is_upgraded) ? (
        <div className="table-responsive">
          <table className="table table-dark table-hover">
            <thead>
              <tr>
                <th>Old Plan</th>
                <th>Old Price</th>
                <th>New Plan</th>
                <th>New Price</th>
                <th>Upgrade Date</th>
              </tr>
            </thead>
            <tbody>
              {userPlans
                .filter(plan => plan.is_upgraded)
                .map((plan, index) => (
                  <tr key={index}>
                    <td>{plan.previous_plan_name || "N/A"}</td>
                    <td>₹{plan.previous_plan_price || "N/A"}</td>
                    <td>{plan.plan_name}</td>
                    <td>₹{plan.plan_price}</td>
                    <td>{formatDate(plan.upgrade_date)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted">No upgrade history found.</p>
      )}
    </div>
  </div>
)}

            {/* Referrals Tab */}
{activeTab === "referrals" && (
  <div>
    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
      <h1 className="h2 text-warning">Referral Program</h1>
    </div>
    
    <div className="row">
      <div className="col-md-6 mb-4">
        <div className="card bg-dark border-warning">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">Your Referral Link</h5>
          </div>
          <div className="card-body">
            <p className="text-white">
              Share your referral link with friends and earn 5% of their plan purchases!
            </p>
            
            <div className="input-group mb-3">
              <input 
                type="text" 
                className="form-control bg-dark text-white border-warning"
                value={`${window.location.origin}/register?ref=${referralCode}`}
                readOnly
              />
              <button 
                className={`btn ${copySuccess ? 'btn-success' : 'btn-warning'}`}
                onClick={copyReferralLink}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                <h5 className="text-warning mb-1">Total Earnings</h5>
                <h3 className="text-white">${referralEarnings.toFixed(2)}</h3>
              </div>
              <div>
                <h5 className="text-warning mb-1">Referrals</h5>
                <h3 className="text-white">{referralHistory.length}</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card bg-dark border-warning mt-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">How It Works</h5>
          </div>
          <div className="card-body">
            <ol className="text-white">
              <li className="mb-3">Share your unique referral link with friends and colleagues</li>
              <li className="mb-3">When they sign up and purchase a plan using your link, you earn 5% of their purchase amount</li>
              <li className="mb-3">Your earnings are automatically added to your investment balance</li>
              <li className="mb-3">There's no limit to how many people you can refer!</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="col-md-6 mb-4">
        <div className="card bg-dark border-warning h-100">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">Referral History</h5>
          </div>
          <div className="card-body">
            {referralHistory.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-dark table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralHistory.map((referral, index) => (
                      <tr key={index}>
                        <td>{new Date(referral.date).toLocaleDateString()}</td>
                        <td>{referral.username}</td>
                        <td>{referral.planName}</td>
                        <td className="text-success">+${referral.earnings.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-5">
                <FaUserPlus size={48} className="text-warning mb-3" />
                <h4>No Referrals Yet</h4>
                <p className="text-muted">
                  Share your referral link to start earning!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* Referral Stats Cards */}
    <div className="row row-cols-1 row-cols-md-3 g-4 mt-2">
      <div className="col">
        <div className="card bg-dark text-white border-warning h-100">
          <div className="card-body">
            <h5 className="card-title text-warning">Referral Rate</h5>
            <p className="card-text display-6">5%</p>
            <p className="card-text text-muted">
              Of each plan purchase
            </p>
          </div>
        </div>
      </div>
      
      <div className="col">
        <div className="card bg-dark text-white border-warning h-100">
          <div className="card-body">
            <h5 className="card-title text-warning">Potential Earnings</h5>
            <p className="card-text display-6">
              ${(availablePlans.length > 0 ? 
                (availablePlans.reduce((sum, plan) => sum + parseFloat(plan.base_price), 0) / availablePlans.length) * 0.05 
                : 0).toFixed(2)}
            </p>
            <p className="card-text text-muted">
              Average per referral
            </p>
          </div>
        </div>
      </div>
      
      <div className="col">
        <div className="card bg-dark text-white border-warning h-100">
          <div className="card-body">
            <h5 className="card-title text-warning">Payment Method</h5>
            <p className="card-text display-6">Instant</p>
            <p className="card-text text-muted">
              Added directly to your balance
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

            {/* Billing History Tab */}
            {activeTab === "billing" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Billing History</h1>
                </div>

                {invoices.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Date</th>
                          <th>Plan</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td>INV-{invoice.id}</td>
                            <td>
                              {new Date(invoice.date).toLocaleDateString()}
                            </td>
                            <td>{invoice.plan_name}</td>
                            <td>${invoice.amount}</td>
                            <td>
                              <span
                                className={`badge bg-${
                                  invoice.status === "paid"
                                    ? "success"
                                    : "warning"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  handleDownloadInvoice(invoice.id)
                                }
                              >
                                <FaDownload className="me-1" /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-5">
                    <FaDownload size={48} className="text-warning mb-3" />
                    <h4>No Billing History</h4>
                    <p className="text-muted">
                      You don't have any invoices or billing history yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Support Tab */}
            {activeTab === "support" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Support Center</h1>
                </div>

                <div className="row">
                  <div className="col-lg-6 mb-4">
                    <div className="card bg-dark border-warning">
                      <div className="card-header bg-warning text-dark">
                        <h5 className="mb-0">Create Support Ticket</h5>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleTicketSubmit}>
                          <div className="mb-3">
                            <label htmlFor="subject" className="form-label">
                              Subject
                            </label>
                            <input
                              type="text"
                              className="form-control bg-dark text-white border-warning"
                              id="subject"
                              name="subject"
                              value={newTicket.subject}
                              onChange={handleTicketInputChange}
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label htmlFor="message" className="form-label">
                              Message
                            </label>
                            <textarea
                              className="form-control bg-dark text-white border-warning"
                              id="message"
                              name="message"
                              rows="5"
                              value={newTicket.message}
                              onChange={handleTicketInputChange}
                              required
                            ></textarea>
                          </div>

                          <div className="mb-3">
                            <label htmlFor="priority" className="form-label">
                              Priority
                            </label>
                            <select
                              className="form-select bg-dark text-white border-warning"
                              id="priority"
                              name="priority"
                              value={newTicket.priority}
                              onChange={handleTicketInputChange}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>

                          <div className="text-end">
                            <button type="submit" className="btn btn-warning">
                              Submit Ticket
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6 mb-4">
                    <h3 className="text-warning mb-3">Your Support Tickets</h3>

                    {supportTickets.length > 0 ? (
                      <div className="accordion" id="ticketAccordion">
                        {supportTickets.map((ticket, index) => (
                          <div
                            className="accordion-item bg-dark border-warning mb-2"
                            key={ticket.id}
                          >
                            <h2
                              className="accordion-header"
                              id={`heading${ticket.id}`}
                            >
                              <button
                                className="accordion-button collapsed bg-dark text-white"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${ticket.id}`}
                                aria-expanded="false"
                                aria-controls={`collapse${ticket.id}`}
                              >
                                <div className="d-flex w-100 justify-content-between align-items-center">
                                  <span>
                                    <span
                                      className={`badge bg-${
                                        ticket.status === "open"
                                          ? "warning"
                                          : ticket.status === "resolved"
                                          ? "success"
                                          : "info"
                                      } me-2`}
                                    >
                                      {ticket.status}
                                    </span>
                                    {ticket.subject}
                                  </span>
                                  <small className="text-muted ms-2">
                                    {new Date(ticket.date).toLocaleDateString()}
                                  </small>
                                </div>
                              </button>
                            </h2>
                            <div
                              id={`collapse${ticket.id}`}
                              className="accordion-collapse collapse"
                              aria-labelledby={`heading${ticket.id}`}
                              data-bs-parent="#ticketAccordion"
                            >
                              <div className="accordion-body">
                                <p>
                                  <strong>Message:</strong>
                                </p>
                                <p>{ticket.message}</p>

                                {ticket.responses &&
                                  ticket.responses.map((response, i) => (
                                    <div
                                      key={i}
                                      className="card bg-secondary text-white mt-3 mb-2"
                                    >
                                      <div className="card-header d-flex justify-content-between">
                                        <span>{response.from}</span>
                                        <small>
                                          {new Date(
                                            response.date
                                          ).toLocaleString()}
                                        </small>
                                      </div>
                                      <div className="card-body">
                                        <p className="card-text">
                                          {response.message}
                                        </p>
                                      </div>
                                    </div>
                                  ))}

                                {ticket.status === "resolved" ? (
                                  <div
                                    className="alert alert-success mt-3"
                                    role="alert"
                                  >
                                    This ticket has been resolved. If you're
                                    still having issues, please create a new
                                    ticket.
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <textarea
                                      className="form-control bg-dark text-white border-warning mb-2"
                                      placeholder="Add a reply..."
                                      rows="3"
                                    ></textarea>
                                    <div className="text-end">
                                      <button className="btn btn-sm btn-warning">
                                        Send Reply
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-5 border border-warning rounded">
                        <FaTicketAlt size={48} className="text-warning mb-3" />
                        <h4>No Support Tickets</h4>
                        <p className="text-muted">
                          You haven't created any support tickets yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-4">
                  <h3 className="text-warning mb-3">
                    Frequently Asked Questions
                  </h3>

                  <div className="accordion" id="faqAccordion">
                    <div className="accordion-item bg-dark border-warning mb-2">
                      <h2 className="accordion-header" id="faqHeading1">
                        <button
                          className="accordion-button collapsed bg-dark text-white"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#faqCollapse1"
                          aria-expanded="false"
                          aria-controls="faqCollapse1"
                        >
                          How do I upgrade my subscription plan?
                        </button>
                      </h2>
                      <div
                        id="faqCollapse1"
                        className="accordion-collapse collapse"
                        aria-labelledby="faqHeading1"
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body">
                          You can upgrade your subscription plan by navigating
                          to the "Upgrade Plan" tab in your dashboard. Select
                          your desired plan and confirm the upgrade. You'll be
                          charged the price difference immediately, and your
                          next billing cycle will use the new price.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item bg-dark border-warning mb-2">
                      <h2 className="accordion-header" id="faqHeading2">
                        <button
                          className="accordion-button collapsed bg-dark text-white"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#faqCollapse2"
                          aria-expanded="false"
                          aria-controls="faqCollapse2"
                        >
                          How can I download my invoices?
                        </button>
                      </h2>
                      <div
                        id="faqCollapse2"
                        className="accordion-collapse collapse"
                        aria-labelledby="faqHeading2"
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body">
                          You can download your invoices from the "Billing
                          History" tab. Each invoice has a download button that
                          allows you to save the invoice as a PDF file.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item bg-dark border-warning mb-2">
                      <h2 className="accordion-header" id="faqHeading3">
                        <button
                          className="accordion-button collapsed bg-dark text-white"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#faqCollapse3"
                          aria-expanded="false"
                          aria-controls="faqCollapse3"
                        >
                          What is the typical response time for support tickets?
                        </button>
                      </h2>
                      <div
                        id="faqCollapse3"
                        className="accordion-collapse collapse"
                        aria-labelledby="faqHeading3"
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body">
                          Our support team typically responds to tickets within
                          24 hours. High priority tickets are addressed more
                          quickly, usually within a few hours during business
                          days.
                        </div>
                      </div>
                    </div>

                    <div className="accordion-item bg-dark border-warning mb-2">
                      <h2 className="accordion-header" id="faqHeading4">
                        <button
                          className="accordion-button collapsed bg-dark text-white"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#faqCollapse4"
                          aria-expanded="false"
                          aria-controls="faqCollapse4"
                        >
                          How do I cancel my subscription?
                        </button>
                      </h2>
                      <div
                        id="faqCollapse4"
                        className="accordion-collapse collapse"
                        aria-labelledby="faqHeading4"
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body">
                          To cancel your subscription, please create a support
                          ticket with the subject "Cancellation Request". Our
                          team will process your request within 1-2 business
                          days. You'll have access to your subscription until
                          the end of your current billing period.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showWithdrawForm && (
              <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content bg-dark text-white border-warning">
                    <div className="modal-header border-warning">
                      <h5 className="modal-title">Withdraw Funds</h5>
                      <button className="btn-close btn-close-white" onClick={() => setShowWithdrawForm(false)}></button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={handleWithdrawSubmit}>
                        <div className="mb-3">
                          <label className="form-label">Available Balance</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={`₹${walletBalance.toFixed(2)}`}
                            disabled
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Withdrawal Amount</label>
                          <input
                            type="number"
                            className="form-control bg-dark text-white border-warning"
                            value={withdrawalForm.amount}
                            onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                            min="1"
                            max={walletBalance}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Bank Name</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={withdrawalForm.bank_name}
                            onChange={(e) => setWithdrawalForm({...withdrawalForm, bank_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Account Number</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={withdrawalForm.account_number}
                            onChange={(e) => setWithdrawalForm({...withdrawalForm, account_number: e.target.value})}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">IFSC Code</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={withdrawalForm.ifsc_code}
                            onChange={(e) => setWithdrawalForm({...withdrawalForm, ifsc_code: e.target.value})}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Account Holder Name</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={withdrawalForm.account_holder_name}
                            onChange={(e) => setWithdrawalForm({...withdrawalForm, account_holder_name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Remarks (Optional)</label>
                          <textarea
                            className="form-control bg-dark text-white border-warning"
                            value={withdrawalForm.remarks}
                            onChange={(e) => setWithdrawalForm({...withdrawalForm, remarks: e.target.value})}
                          />
                        </div>
                        <div className="d-grid">
                          <button type="submit" className="btn btn-warning">Submit Withdrawal Request</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "withdrawals" && (
  <div>
    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
      <h1 className="h2 text-warning">Withdrawal History</h1>
      <button
        className="btn btn-warning"
        onClick={() => setShowWithdrawForm(true)}
      >
        New Withdrawal
      </button>
    </div>

    <div className="table-responsive">
      <table className="table table-dark table-hover">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Bank Details</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {withdrawalHistory.map((withdrawal) => (
            <tr key={withdrawal.id}>
              <td>{new Date(withdrawal.created_at).toLocaleDateString()}</td>
              <td>₹{withdrawal.amount.toFixed(2)}</td>
              <td>
                {withdrawal.bank_name}<br/>
                <small className="text-muted">
                  A/C: {withdrawal.account_number}<br/>
                  IFSC: {withdrawal.ifsc_code}
                </small>
              </td>
              <td>
                <span className={`badge bg-${
                  withdrawal.status === 'pending' ? 'warning' :
                  withdrawal.status === 'approved' ? 'success' : 'danger'
                }`}>
                  {withdrawal.status.toUpperCase()}
                </span>
              </td>
              <td>{withdrawal.remarks || '-'}</td>
            </tr>
          ))}
          {withdrawalHistory.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                No withdrawal history found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
          </main>
        </div>
      </div>
      <Footer />
      <UpgradeModal />
      {renderUpgradedPlans(upgradedPlans)}
    </div>
  );
}

export default UserDashboard;