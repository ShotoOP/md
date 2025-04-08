import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { api } from "../context/AuthContext";  // Add this import
import "./admindash.css";
import {
  FaUsers,
  FaUserPlus,
  FaShoppingCart,
  FaChartLine,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaSave,
  FaBars,
  FaArrowLeft,
  FaTag,
  FaCalendarAlt,
  FaCheck,
  FaBan,
  FaWallet, // Add this import
  FaMoneyBill,
  FaExchangeAlt,
  FaHistory,
  FaClock, // Add this import
} from "react-icons/fa";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    plan_type: "enterprise",
    subcategory: "One Time", // Default subcategory
    plan_name: "",
    base_price: "",
    duration: "18 Months", // Add duration field
    features: {
      users: "",
      storage: "",
      support: "",
      encryption: "",
      backup: "",
      apiAccess: "",
      languageSupport: "",
      dedicatedManager: "",
    },
  });

  const [promoCodes, setPromoCodes] = useState([]);
  const [showAddPromoForm, setShowAddPromoForm] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState(null);
  const [newPromoCode, setNewPromoCode] = useState({
    code: "",
    discount_percentage: 10,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
    applies_to_algo_software: true,
    applies_to_indicators: false,
    applicable_plan_ids: [],
  });

  const [walletBalances, setWalletBalances] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  const [withdrawals, setWithdrawals] = useState([]);
  const [planCollections, setPlanCollections] = useState([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const [durationPromoForm, setDurationPromoForm] = useState({
    code: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    subcategory: ['One Time'], // Changed to array to allow multiple selections
    applicable_plan_ids: [], // Add this to store selected plan IDs
    reduction_days: '' // Add this field
  });
  const [durationPromos, setDurationPromos] = useState([]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setLoading(true);
        await axios.get("https://md-url.onrender.com/admin/stats", {
          withCredentials: true,
        });

        fetchDashboardData();
      } catch (err) {
        console.error("Admin access check failed:", err);
        navigate("/admin-login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
    fetchWalletBalances();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, usersRes, purchasesRes, plansRes, promoCodesRes, withdrawalsRes] =
        await Promise.all([
          axios.get("https://md-url.onrender.com/admin/stats", {
            withCredentials: true,
          }),
          axios.get("https://md-url.onrender.com/admin/users", {
            withCredentials: true,
          }),
          axios.get("https://md-url.onrender.com/admin/recent-purchases", {
            withCredentials: true,
          }),
          axios.get("https://md-url.onrender.com/api/plan-configurations", {
            withCredentials: true,
          }),
          axios.get("https://md-url.onrender.com/admin/promo-codes", {
            withCredentials: true,
          }),
          axios.get("https://md-url.onrender.com/admin/withdrawals", {
            withCredentials: true,
          }),
        ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRecentPurchases(purchasesRes.data);
      setPlans(plansRes.data);
      setPromoCodes(promoCodesRes.data);
      setWithdrawalRequests(withdrawalsRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load admin data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalances = async () => {
    try {
      const response = await axios.get("https://md-url.onrender.com/admin/wallet-balances", { withCredentials: true });
      setWalletBalances(response.data);
    } catch (err) {
      console.error("Error fetching wallet balances:", err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleEditClick = (plan) => {
    setEditingPlan({
      ...plan,
      features: plan.features || {},
    });
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
  };

  const handleInputChange = (e, isFeature = false, featureKey = null) => {
    const { name, value } = e.target;
    if (isFeature) {
      setNewPlan(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureKey]: value,
        },
      }));
    } else {
      setNewPlan(prev => ({
        ...prev,
        [name]: name === 'base_price' ? Number(value) : value,
        // Reset subcategory if changing plan type away from enterprise
        ...(name === 'plan_type' && value !== 'enterprise' ? { subcategory: null } : {}),
      }));
    }
  };

  const handleEditInputChange = (e, isFeature = false, featureKey = null) => {
    if (isFeature) {
      setEditingPlan(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureKey]: e.target.value,
        },
      }));
    } else {
      const { name, value } = e.target;
      setEditingPlan(prev => ({
        ...prev,
        [name]: name === 'base_price' ? Number(value) : value,
      }));
    }
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `https://md-url.onrender.com/admin/plans/${editingPlan.id}`,
        {
          plan_name: editingPlan.plan_name,
          base_price: parseFloat(editingPlan.base_price),
          features: editingPlan.features,
        },
        {
          withCredentials: true,
        }
      );

      setEditingPlan(null);
      fetchDashboardData();
    } catch (err) {
      setError(
        "Failed to update plan. " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleAddPlan = async () => {
    try {
      await axios.post("https://md-url.onrender.com/admin/plans", newPlan, {
        withCredentials: true,
      });

      setShowAddForm(false);
      setNewPlan({
        plan_type: "basic",
        plan_name: "",
        base_price: "",
        features: {
          users: "",
          storage: "",
          support: "",
          encryption: "",
          backup: "",
          apiAccess: "",
          languageSupport: "",
          dedicatedManager: "",
        },
      });
      fetchDashboardData();
    } catch (err) {
      setError(
        "Failed to add plan. " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await axios.delete(`https://md-url.onrender.com/admin/plans/${id}`, {
          withCredentials: true,
        });

        fetchDashboardData();
      } catch (err) {
        setError(
          "Failed to delete plan. " + (err.response?.data?.error || err.message)
        );
      }
    }
  };

  const handleAddPromoCode = async () => {
    try {
      await axios.post(
        "https://md-url.onrender.com/admin/promo-codes",
        newPromoCode,
        {
          withCredentials: true,
        }
      );

      setShowAddPromoForm(false);
      setNewPromoCode({
        code: "",
        discount_percentage: 10,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
        applies_to_algo_software: true,
        applies_to_indicators: false,
        applicable_plan_ids: [],
      });
      fetchDashboardData();
    } catch (err) {
      setError(
        "Failed to add promo code. " +
        (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditPromoCodeClick = (promoCode) => {
    setEditingPromoCode({
      ...promoCode,
      valid_from: new Date(promoCode.valid_from).toISOString().split("T")[0],
      valid_until: promoCode.valid_until
        ? new Date(promoCode.valid_until).toISOString().split("T")[0]
        : "",
    });
  };

  const handleCancelPromoEdit = () => {
    setEditingPromoCode(null);
  };

  const handlePromoInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (editingPromoCode) {
      setEditingPromoCode({
        ...editingPromoCode,
        [name]: type === "checkbox" ? checked : value,
      });
    } else {
      setNewPromoCode({
        ...newPromoCode,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSavePromoCodeEdit = async () => {
    try {
      await axios.put(
        `https://md-url.onrender.com/admin/promo-codes/${editingPromoCode.id}`,
        editingPromoCode,
        {
          withCredentials: true,
        }
      );

      setEditingPromoCode(null);
      fetchDashboardData();
    } catch (err) {
      setError(
        "Failed to update promo code. " +
        (err.response?.data?.error || err.message)
      );
    }
  };

  const handleDeletePromoCode = async (id) => {
    if (window.confirm("Are you sure you want to delete this promo code?")) {
      try {
        await axios.delete(`https://md-url.onrender.com/admin/promo-codes/${id}`, {
          withCredentials: true,
        });

        fetchDashboardData();
      } catch (err) {
        setError(
          "Failed to delete promo code. " +
          (err.response?.data?.error || err.message)
        );
      }
    }
  };

  const handleTogglePromoCodeStatus = async (promoCode) => {
    try {
      await axios.put(
        `https://md-url.onrender.com/admin/promo-codes/${promoCode.id}`,
        {
          ...promoCode,
          is_active: !promoCode.is_active,
        },
        {
          withCredentials: true,
        }
      );

      fetchDashboardData();
    } catch (err) {
      setError(
        "Failed to update promo code status. " +
        (err.response?.data?.error || err.message)
      );
    }
  };

  const handlePlanSelectionForPromo = (planId) => {
    if (editingPromoCode) {
      const updatedPlanIds = [...editingPromoCode.applicable_plan_ids];
      const index = updatedPlanIds.indexOf(planId);

      if (index === -1) {
        updatedPlanIds.push(planId);
      } else {
        updatedPlanIds.splice(index, 1);
      }

      setEditingPromoCode({
        ...editingPromoCode,
        applicable_plan_ids: updatedPlanIds,
      });
    } else {
      const updatedPlanIds = [...newPromoCode.applicable_plan_ids];
      const index = updatedPlanIds.indexOf(planId);

      if (index === -1) {
        updatedPlanIds.push(planId);
      } else {
        updatedPlanIds.splice(index, 1);
      }

      setNewPromoCode({
        ...newPromoCode,
        applicable_plan_ids: updatedPlanIds,
      });
    }
  };

  const handleUpdatePlanStatus = async (planId, planType) => {
    try {
      const response = await axios.post(
        `https://md-url.onrender.com/admin/collect-plan/${planId}`,
        { planType },
        { withCredentials: true }
      );

      // Show success message
      alert('Plan marked as collected successfully');

      // Refresh the purchase list
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating plan status:', err);
      alert(err.response?.data?.error || 'Failed to update plan status');
    }
  };

  const handleWithdrawalAction = async (withdrawalId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this withdrawal request?`)) {
      return;
    }

    try {
      await api.post(`/admin/withdrawals/${withdrawalId}/${action}`);

      // Show success message
      alert(`Withdrawal ${action}ed successfully${action === 'reject' ? '. Amount has been restored to user\'s wallet.' : ''}`);

      // Refresh withdrawal requests
      const response = await api.get('/admin/withdrawals');
      setWithdrawalRequests(response.data);
    } catch (err) {
      console.error(`Error ${action}ing withdrawal:`, err);
      alert(`Failed to ${action} withdrawal. Please try again.`);
    }
  };

  const handlePlanCollection = async (planId, planType) => {
    try {
      if (!window.confirm('Are you sure you want to mark this plan as collected?')) {
        return;
      }

      const response = await axios.post(
        `https://md-url.onrender.com/admin/plans/${planId}/collect`,
        { planType },
        { withCredentials: true }
      );

      // Show success message
      alert('Plan collection status updated successfully');

      // Refresh the purchase list to show updated status
      fetchDashboardData();

    } catch (err) {
      console.error('Error updating plan collection status:', err);
      alert(err.response?.data?.error || 'Failed to update collection status');
    }
  };

  const handleDurationPromoSubmit = async (e) => {
    e.preventDefault();
    const isEditing = durationPromoForm.id != null;

    try {
      const endpoint = isEditing
        ? `https://md-url.onrender.com/admin/duration-promo-codes/${durationPromoForm.id}`
        : 'https://md-url.onrender.com/admin/duration-promo-codes';

      const method = isEditing ? 'put' : 'post';

      const response = await axios[method](
        endpoint,
        {
          ...durationPromoForm,
          reduction_days: parseInt(durationPromoForm.reduction_days)
        },
        { withCredentials: true }
      );

      if (response.status === 201 || response.status === 200) {
        alert(`Duration promo code ${isEditing ? 'updated' : 'created'} successfully!`);
        setDurationPromoForm({
          code: '',
          valid_from: new Date().toISOString().split('T')[0],
          valid_until: '',
          subcategory: ['One Time'],
          applicable_plan_ids: [],
          reduction_days: ''
        });
        fetchDurationPromos();
      }
    } catch (error) {
      alert('Error with promo code: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditDurationPromo = async (promo) => {
    try {
      // Parse JSON strings if they exist, otherwise use default values
      const subcategory = typeof promo.subcategory === 'string' ?
        JSON.parse(promo.subcategory) :
        promo.subcategory || ['One Time'];

      const applicable_plan_ids = typeof promo.applicable_plan_ids === 'string' ?
        JSON.parse(promo.applicable_plan_ids) :
        promo.applicable_plan_ids || [];

      setDurationPromoForm({
        id: promo.id,
        code: promo.code,
        valid_from: new Date(promo.valid_from).toISOString().split('T')[0],
        valid_until: promo.valid_until ? new Date(promo.valid_until).toISOString().split('T')[0] : '',
        reduction_days: promo.reduction_days?.toString() || '',
        subcategory: subcategory,
        applicable_plan_ids: applicable_plan_ids
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error setting up promo edit:', error);
      alert('Error preparing promo code for edit: ' + error.message);
    }
  };

  const fetchDurationPromos = async () => {
    try {
      console.log('Fetching duration promo codes...');
      const response = await axios.get('https://md-url.onrender.com/admin/duration-promo-codes', {
        withCredentials: true
      });

      if (response.data) {
        console.log('Duration promos fetched:', response.data);
        setDurationPromos(response.data);
      } else {
        console.log('No duration promos found');
        setDurationPromos([]);
      }
    } catch (error) {
      console.error('Error fetching duration promos:', error);
      setError('Failed to fetch duration promo codes: ' + (error.response?.data?.error || error.message));
    }
  };

  // Update the useEffect to fetch both on mount and tab change
  useEffect(() => {
    if (activeTab === 'Promo Code') {
      fetchDurationPromos();
    }
  }, [activeTab]);

  const handleDeleteDurationPromo = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this duration promo code?')) {
      return;
    }

    try {
      await axios.delete(`https://md-url.onrender.com/admin/duration-promo-codes/${promoId}`, {
        withCredentials: true
      });

      alert('Duration promo code deleted successfully');
      fetchDurationPromos(); // Refresh the list
    } catch (error) {
      console.error('Error deleting duration promo:', error);
      alert('Error deleting duration promo code: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleDurationPromoStatus = async (promoId) => {
    try {
      const response = await axios.put(
        `https://md-url.onrender.com/admin/duration-promo-codes/${promoId}/toggle-status`,
        {},
        { withCredentials: true }
      );

      if (response.data && response.data.message) {
        // Update local state immediately
        setDurationPromos(currentPromos =>
          currentPromos.map(promo =>
            promo.id === promoId
              ? { ...promo, is_active: !promo.is_active }
              : promo
          )
        );

        // Show success message
        alert('Status updated successfully');
      }
    } catch (error) {
      console.error('Error toggling duration promo status:', error);
      alert('Failed to update status: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderDurationPromoSection = () => (
    <div className="bg-dark text-white mb-4">
      <div className="mb-2 header bg-warning d-flex justify-content-between align-items-center">
        <h5 className="p-2 text-dark">
          <FaClock className="me-2 text-dark" />
          Smart Investment Duration Promo Codes
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleDurationPromoSubmit} className="mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label text-white">Promo Code</label>
              <input
                type="text"
                className="form-control"
                value={durationPromoForm.code}
                onChange={(e) => setDurationPromoForm({
                  ...durationPromoForm,
                  code: e.target.value.toUpperCase()
                })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label text-white">Duration Reduction (Days)</label>
              <input
                type="number"
                className="form-control"
                value={durationPromoForm.reduction_days}
                onChange={(e) => setDurationPromoForm({
                  ...durationPromoForm,
                  reduction_days: Math.max(1, parseInt(e.target.value) || '')
                })}
                min="1"
                required
                placeholder="Enter number of days to reduce"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label text-white">Valid From</label>
              <input
                type="date"
                className="form-control"
                value={durationPromoForm.valid_from}
                onChange={(e) => setDurationPromoForm({
                  ...durationPromoForm,
                  valid_from: e.target.value
                })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-white">Valid Until</label>
              <input
                type="date"
                className="form-control"
                value={durationPromoForm.valid_until}
                onChange={(e) => setDurationPromoForm({
                  ...durationPromoForm,
                  valid_until: e.target.value
                })}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label text-white">Select Plans</label>
            <div className="row g-3">
              {['One Time', 'Profit Split', 'Income Flow Builder'].map(category => (
                <div key={category} className="col-md-4">
                  <div className="p-4 bg-dark border-warning" style={{ border: "2px solid #ffc107", borderRadius: "10px"  }}>
                    <div className="card-header">
                      <h6 className="mb-0 text-white">{category}</h6>
                    </div>
                    <div className="card-body">
                      {plans
                        .filter(plan =>
                          plan.plan_type === 'enterprise' &&
                          plan.subcategory === category
                        )
                        .map(plan => (
                          <div key={plan.id} className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`plan-${plan.id}`}
                              checked={durationPromoForm.applicable_plan_ids.includes(plan.id)}
                              onChange={(e) => {
                                const updatedIds = e.target.checked
                                  ? [...durationPromoForm.applicable_plan_ids, plan.id]
                                  : durationPromoForm.applicable_plan_ids.filter(id => id !== plan.id);
                                setDurationPromoForm({
                                  ...durationPromoForm,
                                  applicable_plan_ids: updatedIds,
                                  subcategory: [...new Set([...durationPromoForm.subcategory, plan.subcategory])]
                                });
                              }}
                            />
                            <label className="form-check-label text-white" htmlFor={`plan-${plan.id}`}>
                              {plan.plan_name} - {plan.duration}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-warning mt-4">
            {durationPromoForm.id ? (
              <>
                <FaSave className="me-2" />
                Update Duration Promo Code
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                Create Duration Promo Code
              </>
            )}
          </button>

          {durationPromoForm.id && (
            <button
              type="button"
              className="btn btn-secondary mt-4 ms-2"
              onClick={() => {
                setDurationPromoForm({
                  code: '',
                  valid_from: new Date().toISOString().split('T')[0],
                  valid_until: '',
                  subcategory: ['One Time'],
                  applicable_plan_ids: [],
                  reduction_days: ''
                });
              }}
            >
              <FaTimes className="me-2" />
              Cancel Edit
            </button>
          )}
        </form>

        <h6 className="mt-4 mb-3">Existing Duration Promo Codes</h6>
        <div className="table-responsive">
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                <th>Code</th>
                <th>Reduction Days</th>
                <th>Applicable Plans</th>
                <th>Valid From</th>
                <th>Valid Until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {durationPromos.length > 0 ? (
                durationPromos.map((promo) => (
                  <tr key={promo.id}>
                    <td>{promo.code}</td>
                    <td>{promo.reduction_days} days</td>
                    <td>
                      {plans
                        .filter(plan => promo.applicable_plan_ids?.includes(plan.id))
                        .map(plan => (
                          <span key={plan.id} className="badge bg-warning text-dark me-1 mb-1">
                            {plan.plan_name}
                          </span>
                        ))}
                    </td>
                    <td>{new Date(promo.valid_from).toLocaleDateString()}</td>
                    <td>
                      {promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-warning"
                          onClick={() => handleEditDurationPromo(promo)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteDurationPromo(promo.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No duration promo codes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-dark">
        <div className="container mt-5 pt-5 text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-white">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="AdminDashboard bg-dark vh-100">
      <div className="container-fluid pt-4 bg-dark">
        <button
          className="btn btn-warning d-md-none mb-3 position-fixed start-0 ms-2 z-index-1030"
          onClick={toggleSidebar}
          style={{ top: "70px", zIndex: 1030 }}
        >
          {sidebarOpen ? <FaArrowLeft /> : <FaBars />}
        </button>

        <div className="row">
          <div
            className={`sidebar col-md-3 col-lg-2 bg-dark d-${sidebarOpen ? "block" : "none"
              } d-md-block position-fixed h-100 border-end border-3 border-warning shadow-lg`}
            style={{ zIndex: 1029, overflowY: "auto", top: "56px" }}
          >
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                <li className="nav-item">
                  <button
                    className={`nav-link btn border-0 shadow-none ${activeTab === "dashboard" ? "text-warning" : "text-white"
                      }`}
                    onClick={() => handleTabClick("dashboard")}
                  >
                    <FaChartLine className="me-2" />
                    Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn shadow-none ${activeTab === "users" ? "text-warning" : "text-white"
                      }`}
                    onClick={() => handleTabClick("users")}
                  >
                    <FaUsers className="me-2" />
                    Users
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn shadow-none ${activeTab === "purchases" ? "text-warning" : "text-white"
                      }`}
                    onClick={() => handleTabClick("purchases")}
                  >
                    <FaShoppingCart className="me-2" />
                    Purchases
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn shadow-none ${activeTab === "plans" ? "text-warning" : "text-white"
                      }`}
                    onClick={() => handleTabClick("plans")}
                  >
                    <FaEdit className="me-2" />
                    Manage Plans
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn shadow-none ${activeTab === "Promo Code" ? "text-warning" : "text-white"
                      }`}
                    onClick={() => handleTabClick("Promo Code")}
                  >
                    <FaTag className="me-2" />
                    Promo Codes
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn shadow-none ${activeTab === "wallets" ? "text-warning" : "text-white"
                      }`}
                    onClick={() => handleTabClick("wallets")}
                  >
                    <FaWallet className="me-2" />
                    Wallet Balances
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn shadow-none ${activeTab === "withdrawals" ? "text-warning" : "text-white"}`}
                    onClick={() => handleTabClick("withdrawals")}
                  >
                    <FaMoneyBill className="me-2" />
                    Withdrawals
                  </button>
                </li>
                <li className="nav-item mt-5">
                  <button
                    className="nav-link btn shadow-none text-white"
                    onClick={async () => {
                      try {
                        await axios.post(
                          "https://md-url.onrender.com/admin/logout",
                          {},
                          { withCredentials: true }
                        );
                        navigate("/admin-login");
                      } catch (err) {
                        console.error("Logout failed:", err);
                      }
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <main
            className={`col-12 ${sidebarOpen ? "ps-0" : ""
              } col-md-9 col-lg-10 ms-auto px-md-4 bg-dark text-white`}
          >
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="bg-dark">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Admin Dashboard</h1>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={fetchDashboardData}
                  >
                    Refresh Data
                  </button>
                </div>

                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 mb-4">
                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">Total Users</h5>
                        <p className="card-text display-4">
                          {stats.totalUsers || 0}
                        </p>
                        <FaUsers
                          className="position-absolute bottom-0 end-0 m-3 text-warning opacity-25"
                          size={32}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          New Users (7 days)
                        </h5>
                        <p className="card-text display-4">
                          {stats.newUsers || 0}
                        </p>
                        <FaUserPlus
                          className="position-absolute bottom-0 end-0 m-3 text-warning opacity-25"
                          size={32}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          Total Plans Sold
                        </h5>
                        <p className="card-text display-4">
                          {stats.totalPlans || 0}
                        </p>
                        <FaShoppingCart
                          className="position-absolute bottom-0 end-0 m-3 text-warning opacity-25"
                          size={32}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col">
                    <div className="card bg-dark text-white border-warning h-100">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          Plan Distribution
                        </h5>
                        <div className="mt-2">
                          {stats.planTypes &&
                            stats.planTypes.map((planType, index) => (
                              <div key={index} className="mb-1">
                                <small>
                                  {planType.plan_type}: {planType.count}
                                </small>
                                <div
                                  className="progress"
                                  style={{ height: "5px" }}
                                >
                                  <div
                                    className="progress-bar bg-warning"
                                    style={{
                                      width: `${(planType.count /
                                        (stats.totalPlans || 1)) *
                                        100
                                        }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <h3 className="text-warning">Recent Users</h3>
                    <div className="table-responsive">
                      <table className="table table-dark table-hover">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Verified</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.slice(0, 5).map((user) => (
                            <tr key={user.id}>
                              <td>{user.username}</td>
                              <td>{user.email}</td>
                              <td>
                                {user.email_verified ? (
                                  <span className="badge bg-success">Yes</span>
                                ) : (
                                  <span className="badge bg-danger">No</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h3 className="text-warning">Recent Purchases</h3>
                    <div className="table-responsive">
                      <table className="table table-dark table-hover">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Plan</th>
                            <th>Price</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPurchases.slice(0, 5).map((purchase) => (
                            <tr key={purchase.id}>
                              <td>{purchase.username}</td>
                              <td>{purchase.plan_name}</td>
                              <td>${purchase.plan_price}</td>
                              <td>
                                {new Date(
                                  purchase.purchase_date
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">User Management</h1>
                </div>

                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Verified</th>
                        <th>Provider</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            {user.email_verified ? (
                              <span className="badge bg-success">Yes</span>
                            ) : (
                              <span className="badge bg-danger">No</span>
                            )}
                          </td>
                          <td>{user.provider || "Email"}</td>
                          <td>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "purchases" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Purchase History</h1>
                </div>

                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Plan Type</th>
                        <th>Plan Name</th>
                        <th>Price</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Purchase Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPurchases.map((purchase) => (
                        <tr key={`${purchase.plan_type}-${purchase.id}`}>
                          <td>{purchase.id}</td>
                          <td>{purchase.username}</td>
                          <td>{purchase.email}</td>
                          <td>{purchase.plan_type}</td>
                          <td>{purchase.plan_name}</td>
                          <td>${purchase.plan_price}</td>
                          <td>{purchase.duration}</td>
                          <td>
                            {purchase.is_expired ? (
                              <span className="badge bg-danger">Expired</span>
                            ) : (
                              <span className="badge bg-success">Active</span>
                            )}
                            {purchase.is_collected && (
                              <span className="badge bg-info ms-1">Collected</span>
                            )}
                          </td>
                          <td>
                            {new Date(
                              purchase.purchase_date
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            {!purchase.is_collected && (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  handleUpdatePlanStatus(purchase.id, purchase.plan_type)
                                }
                              >
                                Mark as Collected
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "Promo Code" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Promo Code Management</h1>
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setShowAddPromoForm(!showAddPromoForm);
                      setNewPromoCode({
                        code: "",
                        discount_percentage: 10,
                        valid_from: new Date().toISOString().split("T")[0],
                        valid_until: "",
                        applies_to_algo_software: true,
                        applies_to_indicators: false,
                        applicable_plan_ids: [],
                      });
                    }}
                  >
                    {showAddPromoForm ? (
                      <>
                        <FaTimes className="me-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Add New Promo Code
                      </>
                    )}
                  </button>
                </div>

                {showAddPromoForm && (
                  <div className="bg-dark border-warning mb-4">
                    <div className="mb-2 header bg-warning text-dark">
                      <h5 className="p-2">Add New Promo Code</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Promo Code</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            name="code"
                            value={newPromoCode.code}
                            onChange={(e) =>
                              setNewPromoCode({
                                ...newPromoCode,
                                code: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="e.g., SUMMER20"
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">
                            Discount Percentage
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            className="form-control bg-dark text-white border-warning"
                            name="discount_percentage"
                            value={newPromoCode.discount_percentage}
                            onChange={(e) =>
                              setNewPromoCode({
                                ...newPromoCode,
                                discount_percentage: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Valid From</label>
                          <input
                            type="date"
                            className="form-control bg-dark text-white border-warning"
                            name="valid_from"
                            value={newPromoCode.valid_from}
                            onChange={(e) =>
                              setNewPromoCode({
                                ...newPromoCode,
                                valid_from: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">
                            Valid Until (Optional)
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark text-white border-warning"
                            name="valid_until"
                            value={newPromoCode.valid_until}
                            onChange={(e) =>
                              setNewPromoCode({
                                ...newPromoCode,
                                valid_until: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="row mt-4">
                        <div className="col-md-5 mb-4">
                          <div className="card bg-dark border-warning h-100">
                            <div className="card-header bg-primary text-white">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="applies_to_algo_software"
                                  checked={
                                    newPromoCode.applies_to_algo_software
                                  }
                                  onChange={(e) =>
                                    setNewPromoCode({
                                      ...newPromoCode,
                                      applies_to_algo_software:
                                        e.target.checked,
                                    })
                                  }
                                />
                                <label
                                  className="form-check-label fw-bold"
                                  htmlFor="applies_to_algo_software"
                                >
                                  Algo Software Plans
                                </label>
                              </div>
                            </div>
                            <div className="card-body">
                              {newPromoCode.applies_to_algo_software ? (
                                <>
                                  <div className="mb-3">
                                    <label className="form-label text-white">
                                      Select Plans
                                    </label>
                                    <select
                                      className="form-select bg-dark text-white border-warning mb-2"
                                      multiple
                                      size={Math.min(
                                        5,
                                        plans.filter(
                                          (p) => p.plan_type === "basic"
                                        ).length
                                      )}
                                      onChange={(e) => {
                                        const selectedOptions = Array.from(
                                          e.target.selectedOptions,
                                          (option) => parseInt(option.value)
                                        );
                                        const currentIds = [
                                          ...newPromoCode.applicable_plan_ids,
                                        ];

                                        const nonBasicPlanIds =
                                          currentIds.filter((id) => {
                                            const plan = plans.find(
                                              (p) => p.id === id
                                            );
                                            return (
                                              plan && plan.plan_type !== "basic"
                                            );
                                          });

                                        setNewPromoCode({
                                          ...newPromoCode,
                                          applicable_plan_ids: [
                                            ...nonBasicPlanIds,
                                            ...selectedOptions,
                                          ],
                                        });
                                      }}
                                    >
                                      {plans
                                        .filter(
                                          (plan) => plan.plan_type === "basic"
                                        )
                                        .map((plan) => (
                                          <option
                                            key={plan.id}
                                            value={plan.id}
                                            selected={newPromoCode.applicable_plan_ids.includes(
                                              plan.id
                                            )}
                                          >
                                            {plan.plan_name} (${plan.base_price}
                                            )
                                          </option>
                                        ))}
                                    </select>
                                    <small className="text-white d-block">
                                      Hold Ctrl/Cmd to select multiple plans
                                    </small>
                                  </div>

                                  <div className="mt-3">
                                    <h6 className="text-white">
                                      Selected Algo Software Plans:
                                    </h6>
                                    {newPromoCode.applicable_plan_ids.length >
                                      0 ? (
                                      <div className="d-flex flex-wrap gap-2 mt-2">
                                        {newPromoCode.applicable_plan_ids
                                          .map((id) =>
                                            plans.find((p) => p.id === id)
                                          )
                                          .filter(
                                            (plan) =>
                                              plan && plan.plan_type === "basic"
                                          )
                                          .map((plan) => (
                                            <span
                                              key={plan.id}
                                              className="badge bg-primary d-flex align-items-center"
                                            >
                                              {plan.plan_name}
                                              <button
                                                className="btn btn-sm text-white ms-2 p-0"
                                                onClick={() => {
                                                  setNewPromoCode({
                                                    ...newPromoCode,
                                                    applicable_plan_ids:
                                                      newPromoCode.applicable_plan_ids.filter(
                                                        (id) => id !== plan.id
                                                      ),
                                                  });
                                                }}
                                              >
                                                <FaTimes size={10} />
                                              </button>
                                            </span>
                                          ))}
                                      </div>
                                    ) : (
                                      <p className="text-white small">
                                        No plans selected. Promo code will apply
                                        to all Algo Software plans.
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-white py-4">
                                  Enable Algo Software Plans to select specific
                                  plans
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-5 mb-4">
                          <div className="card bg-dark border-warning h-100">
                            <div className="card-header bg-info text-white">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="applies_to_indicators"
                                  checked={newPromoCode.applies_to_indicators}
                                  onChange={(e) =>
                                    setNewPromoCode({
                                      ...newPromoCode,
                                      applies_to_indicators: e.target.checked,
                                    })
                                  }
                                />
                                <label
                                  className="form-check-label fw-bold"
                                  htmlFor="applies_to_indicators"
                                >
                                  Indicator Plans
                                </label>
                              </div>
                            </div>
                            <div className="card-body">
                              {newPromoCode.applies_to_indicators ? (
                                <>
                                  <div className="mb-3">
                                    <label className="form-label text-white">
                                      Select Plans
                                    </label>
                                    <select
                                      className="form-select bg-dark text-white border-warning mb-2"
                                      multiple
                                      size={Math.min(
                                        5,
                                        plans.filter(
                                          (p) => p.plan_type === "premium"
                                        ).length
                                      )}
                                      onChange={(e) => {
                                        const selectedOptions = Array.from(
                                          e.target.selectedOptions,
                                          (option) => parseInt(option.value)
                                        );
                                        const currentIds = [
                                          ...newPromoCode.applicable_plan_ids,
                                        ];

                                        const nonPremiumPlanIds =
                                          currentIds.filter((id) => {
                                            const plan = plans.find(
                                              (p) => p.id === id
                                            );
                                            return (
                                              plan &&
                                              plan.plan_type !== "premium"
                                            );
                                          });

                                        setNewPromoCode({
                                          ...newPromoCode,
                                          applicable_plan_ids: [
                                            ...nonPremiumPlanIds,
                                            ...selectedOptions,
                                          ],
                                        });
                                      }}
                                    >
                                      {plans
                                        .filter(
                                          (plan) => plan.plan_type === "premium"
                                        )
                                        .map((plan) => (
                                          <option
                                            key={plan.id}
                                            value={plan.id}
                                            selected={newPromoCode.applicable_plan_ids.includes(
                                              plan.id
                                            )}
                                          >
                                            {plan.plan_name} (${plan.base_price}
                                            )
                                          </option>
                                        ))}
                                    </select>
                                    <small className="text-white d-block">
                                      Hold Ctrl/Cmd to select multiple plans
                                    </small>
                                  </div>

                                  <div className="mt-3">
                                    <h6 className="text-white">
                                      Selected Indicator Plans:
                                    </h6>
                                    {newPromoCode.applicable_plan_ids.length >
                                      0 ? (
                                      <div className="d-flex flex-wrap gap-2 mt-2">
                                        {newPromoCode.applicable_plan_ids
                                          .map((id) =>
                                            plans.find((p) => p.id === id)
                                          )
                                          .filter(
                                            (plan) =>
                                              plan &&
                                              plan.plan_type === "premium"
                                          )
                                          .map((plan) => (
                                            <span
                                              key={plan.id}
                                              className="badge bg-info d-flex align-items-center"
                                            >
                                              {plan.plan_name}
                                              <button
                                                className="btn btn-sm text-white ms-2 p-0"
                                                onClick={() => {
                                                  setNewPromoCode({
                                                    ...newPromoCode,
                                                    applicable_plan_ids:
                                                      newPromoCode.applicable_plan_ids.filter(
                                                        (id) => id !== plan.id
                                                      ),
                                                  });
                                                }}
                                              >
                                                <FaTimes size={10} />
                                              </button>
                                            </span>
                                          ))}
                                      </div>
                                    ) : (
                                      <p className="text-white small">
                                        No plans selected. Promo code will apply
                                        to all Indicator plans.
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-white py-4">
                                  Enable Indicator Plans to select specific
                                  plans
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-end mt-3">
                        <button
                          className="btn btn-warning"
                          onClick={handleAddPromoCode}
                        >
                          <FaSave className="me-2" />
                          Save Promo Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {editingPromoCode && (
                  <div className="card bg-dark border-warning mb-4">
                    <div className="card-header bg-warning text-dark">
                      <h5 className="mb-0">Edit Promo Code</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Promo Code</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            name="code"
                            value={editingPromoCode.code}
                            onChange={(e) =>
                              setEditingPromoCode({
                                ...editingPromoCode,
                                code: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">
                            Discount Percentage
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            className="form-control bg-dark text-white border-warning"
                            name="discount_percentage"
                            value={editingPromoCode.discount_percentage}
                            onChange={(e) =>
                              setEditingPromoCode({
                                ...editingPromoCode,
                                discount_percentage: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Status</label>
                          <div className="form-check form-switch mt-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_active"
                              name="is_active"
                              checked={editingPromoCode.is_active}
                              onChange={(e) =>
                                setEditingPromoCode({
                                  ...editingPromoCode,
                                  is_active: e.target.checked,
                                })
                              }
                            />
                            <label className="form-check-label" htmlFor="is_active">
                              {editingPromoCode.is_active ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Valid From</label>
                          <input
                            type="date"
                            className="form-control bg-dark text-white border-warning"
                            name="valid_from"
                            value={editingPromoCode.valid_from}
                            onChange={(e) =>
                              setEditingPromoCode({
                                ...editingPromoCode,
                                valid_from: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">
                            Valid Until (Optional)
                          </label>
                          <input
                            type="date"
                            className="form-control bg-dark text-white border-warning"
                            name="valid_until"
                            value={editingPromoCode.valid_until}
                            onChange={(e) =>
                              setEditingPromoCode({
                                ...editingPromoCode,
                                valid_until: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="row mt-4">
                        <div className="col-md-6 mb-4">
                          <div className="card bg-dark border-warning h-100">
                            <div className="card-header bg-primary text-white">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="edit_applies_to_algo_software"
                                  checked={
                                    editingPromoCode.applies_to_algo_software
                                  }
                                  onChange={(e) =>
                                    setEditingPromoCode({
                                      ...editingPromoCode,
                                      applies_to_algo_software:
                                        e.target.checked,
                                    })
                                  }
                                />
                                <label
                                  className="form-check-label fw-bold"
                                  htmlFor="edit_applies_to_algo_software"
                                >
                                  Algo Software Plans
                                </label>
                              </div>
                            </div>
                            <div className="card-body">
                              {editingPromoCode.applies_to_algo_software ? (
                                <>
                                  <div className="mb-3">
                                    <label className="form-label text-white">
                                      Select Plans
                                    </label>
                                    <select
                                      className="form-select bg-dark text-white border-warning mb-2"
                                      multiple
                                      size={Math.min(
                                        5,
                                        plans.filter(
                                          (p) => p.plan_type === "basic"
                                        ).length
                                      )}
                                      onChange={(e) => {
                                        const selectedOptions = Array.from(
                                          e.target.selectedOptions,
                                          (option) => parseInt(option.value)
                                        );
                                        const currentIds = [
                                          ...editingPromoCode.applicable_plan_ids,
                                        ];

                                        const nonBasicPlanIds =
                                          currentIds.filter((id) => {
                                            const plan = plans.find(
                                              (p) => p.id === id
                                            );
                                            return (
                                              plan && plan.plan_type !== "basic"
                                            );
                                          });

                                        setEditingPromoCode({
                                          ...editingPromoCode,
                                          applicable_plan_ids: [
                                            ...nonBasicPlanIds,
                                            ...selectedOptions,
                                          ],
                                        });
                                      }}
                                    >
                                      {plans
                                        .filter(
                                          (plan) => plan.plan_type === "basic"
                                        )
                                        .map((plan) => (
                                          <option
                                            key={plan.id}
                                            value={plan.id}
                                            selected={editingPromoCode.applicable_plan_ids.includes(
                                              plan.id
                                            )}
                                          >
                                            {plan.plan_name} (${plan.base_price}
                                            )
                                          </option>
                                        ))}
                                    </select>
                                    <small className="text-white d-block">
                                      Hold Ctrl/Cmd to select multiple plans
                                    </small>
                                  </div>

                                  <div className="mt-3">
                                    <h6 className="text-white">
                                      Selected Algo Software Plans:
                                    </h6>
                                    {editingPromoCode.applicable_plan_ids
                                      .length > 0 ? (
                                      <div className="d-flex flex-wrap gap-2 mt-2">
                                        {editingPromoCode.applicable_plan_ids
                                          .map((id) =>
                                            plans.find((p) => p.id === id)
                                          )
                                          .filter(
                                            (plan) =>
                                              plan && plan.plan_type === "basic"
                                          )
                                          .map((plan) => (
                                            <span
                                              key={plan.id}
                                              className="badge bg-primary d-flex align-items-center"
                                            >
                                              {plan.plan_name}
                                              <button
                                                className="btn btn-sm text-white ms-2 p-0"
                                                onClick={() => {
                                                  setEditingPromoCode({
                                                    ...editingPromoCode,
                                                    applicable_plan_ids:
                                                      editingPromoCode.applicable_plan_ids.filter(
                                                        (id) => id !== plan.id
                                                      ),
                                                  });
                                                }}
                                              >
                                                <FaTimes size={10} />
                                              </button>
                                            </span>
                                          ))}
                                      </div>
                                    ) : (
                                      <p className="text-white small">
                                        No plans selected. Promo code will apply
                                        to all Algo Software plans.
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-white py-4">
                                  Enable Algo Software Plans to select specific
                                  plans
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6 mb-4">
                          <div className="card bg-dark border-warning h-100">
                            <div className="card-header bg-info text-white">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="edit_applies_to_indicators"
                                  checked={
                                    editingPromoCode.applies_to_indicators
                                  }
                                  onChange={(e) =>
                                    setEditingPromoCode({
                                      ...editingPromoCode,
                                      applies_to_indicators: e.target.checked,
                                    })
                                  }
                                />
                                <label
                                  className="form-check-label fw-bold"
                                  htmlFor="edit_applies_to_indicators"
                                >
                                  Indicator Plans
                                </label>
                              </div>
                            </div>
                            <div className="card-body">
                              {editingPromoCode.applies_to_indicators ? (
                                <>
                                  <div className="mb-3">
                                    <label className="form-label text-white">
                                      Select Plans
                                    </label>
                                    <select
                                      className="form-select bg-dark text-white border-warning mb-2"
                                      multiple
                                      size={Math.min(
                                        5,
                                        plans.filter(
                                          (p) => p.plan_type === "premium"
                                        ).length
                                      )}
                                      onChange={(e) => {
                                        const selectedOptions = Array.from(
                                          e.target.selectedOptions,
                                          (option) => parseInt(option.value)
                                        );
                                        const currentIds = [
                                          ...editingPromoCode.applicable_plan_ids,
                                        ];

                                        const nonPremiumPlanIds =
                                          currentIds.filter((id) => {
                                            const plan = plans.find(
                                              (p) => p.id === id
                                            );
                                            return (
                                              plan &&
                                              plan.plan_type !== "premium"
                                            );
                                          });

                                        setEditingPromoCode({
                                          ...editingPromoCode,
                                          applicable_plan_ids: [
                                            ...nonPremiumPlanIds,
                                            ...selectedOptions,
                                          ],
                                        });
                                      }}
                                    >
                                      {plans
                                        .filter(
                                          (plan) => plan.plan_type === "premium"
                                        )
                                        .map((plan) => (
                                          <option
                                            key={plan.id}
                                            value={plan.id}
                                            selected={editingPromoCode.applicable_plan_ids.includes(
                                              plan.id
                                            )}
                                          >
                                            {plan.plan_name} (${plan.base_price}
                                            )
                                          </option>
                                        ))}
                                    </select>
                                    <small className="text-white d-block">
                                      Hold Ctrl/Cmd to select multiple plans
                                    </small>
                                  </div>

                                  <div className="mt-3">
                                    <h6 className="text-white">
                                      Selected Indicator Plans:
                                    </h6>
                                    {editingPromoCode.applicable_plan_ids
                                      .length > 0 ? (
                                      <div className="d-flex flex-wrap gap-2 mt-2">
                                        {editingPromoCode.applicable_plan_ids
                                          .map((id) =>
                                            plans.find((p) => p.id === id)
                                          )
                                          .filter(
                                            (plan) =>
                                              plan &&
                                              plan.plan_type === "premium"
                                          )
                                          .map((plan) => (
                                            <span
                                              key={plan.id}
                                              className="badge bg-info d-flex align-items-center"
                                            >
                                              {plan.plan_name}
                                              <button
                                                className="btn btn-sm text-white ms-2 p-0"
                                                onClick={() => {
                                                  setEditingPromoCode({
                                                    ...editingPromoCode,
                                                    applicable_plan_ids:
                                                      editingPromoCode.applicable_plan_ids.filter(
                                                        (id) => id !== plan.id
                                                      ),
                                                  });
                                                }}
                                              >
                                                <FaTimes size={10} />
                                              </button>
                                            </span>
                                          ))}
                                      </div>
                                    ) : (
                                      <p className="text-white small">
                                        No plans selected. Promo code will apply
                                        to all Indicator plans.
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center text-white py-4">
                                  Enable Indicator Plans to select specific
                                  plans
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <button
                          className="btn btn-secondary"
                          onClick={handleCancelPromoEdit}
                        >
                          <FaTimes className="me-2" />
                          Cancel
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={handleSavePromoCodeEdit}
                        >
                          <FaSave className="me-2" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Discount</th>
                        <th>Valid Period</th>
                        <th>Applies To</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map((promoCode) => (
                        <tr key={promoCode.id}>
                          <td>{promoCode.code}</td>
                          <td>{promoCode.discount_percentage}%</td>
                          <td>
                            {new Date(
                              promoCode.valid_from
                            ).toLocaleDateString()}{" "}
                            -
                            {promoCode.valid_until
                              ? new Date(
                                promoCode.valid_until
                              ).toLocaleDateString()
                              : " No expiry"}
                          </td>
                          <td>
                            {promoCode.applies_to_algo_software && (
                              <span className="badge bg-primary me-1">
                                Algo Software
                              </span>
                            )}
                            {promoCode.applies_to_indicators && (
                              <span className="badge bg-info me-1">
                                Indicators
                              </span>
                            )}
                            <br />
                            <small>
                              {promoCode.applicable_plan_ids.length > 0 ? (
                                <>
                                  {promoCode.applicable_plan_ids
                                    .map((id) => plans.find((p) => p.id === id))
                                    .filter(Boolean)
                                    .map((plan) => plan.plan_name)
                                    .join(", ")}
                                </>
                              ) : (
                                "All eligible plans"
                              )}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-warning"
                                onClick={() =>
                                  handleEditPromoCodeClick(promoCode)
                                }
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() =>
                                  handleDeletePromoCode(promoCode.id)
                                }
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {promoCodes.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No promo codes found. Create your first promo code!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {renderDurationPromoSection()}
              </div>
            )}

            {activeTab === "plans" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Plan Management</h1>
                  <button
                    className="btn btn-warning"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? (
                      <>
                        <FaTimes className="me-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Add New Plan
                      </>
                    )}
                  </button>
                </div>

                {showAddForm && (
                  <div className="bg-dark border-warning mb-4">
                    <div className="header bg-warning text-dark">
                      <h5 className="mb-2 p-2">Add New Plan</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Plan Type</label>
                          <select
                            className="form-select bg-dark text-white border-warning"
                            name="plan_type"
                            value={newPlan.plan_type}
                            onChange={(e) => handleInputChange(e)}
                          >
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>

                        {/* Only show subcategory dropdown for enterprise (Smart Investment) plans */}
                        {newPlan.plan_type === "enterprise" && (
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-white">Subcategory</label>
                            <select
                              className="form-select bg-dark text-white border-warning"
                              name="subcategory"
                              value={newPlan.subcategory}
                              onChange={handleInputChange}
                            >
                              <option value="One Time">One Time</option>
                              <option value="Profit Split">Profit Split</option>
                              <option value="Income Flow Builder">Income Flow Builder</option>
                            </select>
                          </div>
                        )}

                        {/* Rest of the form fields */}
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Plan Name</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            name="plan_name"
                            value={newPlan.plan_name}
                            onChange={(e) => handleInputChange(e)}
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Base Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control bg-dark text-white border-warning"
                            name="base_price"
                            value={newPlan.base_price}
                            onChange={(e) => handleInputChange(e)}
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label text-white">Duration</label>
                          {newPlan.plan_type === 'enterprise' ? (
                            <select
                              className="form-select bg-dark text-white border-warning"
                              name="duration"
                              value={newPlan.duration}
                              onChange={handleInputChange}
                            >
                              <option value="18 Months">18 Months</option>
                              <option value="21 Months">21 Months</option>
                              <option value="24 Months">24 Months</option>
                            </select>
                          ) : (
                            <select
                              className="form-select bg-dark text-white border-warning"
                              name="duration"
                              value={newPlan.duration}
                              onChange={handleInputChange}
                            >
                              <option value="7 Days">7 Days</option>
                              <option value="1 Month">1 Month</option>
                              <option value="3 Months">3 Months</option>
                              <option value="6 Months">6 Months</option>
                              <option value="1 Year">1 Year</option>
                              <option value="5 Years">5 Years</option>
                            </select>
                          )}
                        </div>
                      </div>

                      <h6 className="mt-3 text-warning">Features</h6>
                      <div className="row">
                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">Users</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.users}
                            onChange={(e) =>
                              handleInputChange(e, true, "users")
                            }
                          />
                        </div>

                        <div className="col-md-3                         mb-3">
                          <label className="form-label text-white">Storage</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.storage}
                            onChange={(e) =>
                              handleInputChange(e, true, "storage")
                            }
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">Support</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.support}
                            onChange={(e) =>
                              handleInputChange(e, true, "support")
                            }
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">Encryption</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.encryption}
                            onChange={(e) =>
                              handleInputChange(e, true, "encryption")
                            }
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">Backup</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.backup}
                            onChange={(e) =>
                              handleInputChange(e, true, "backup")
                            }
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">API Access</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.apiAccess}
                            onChange={(e) =>
                              handleInputChange(e, true, "apiAccess")
                            }
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">Language Support</label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.languageSupport}
                            onChange={(e) =>
                              handleInputChange(e, true, "languageSupport")
                            }
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label text-white">
                            Dedicated Manager
                          </label>
                          <input
                            type="text"
                            className="form-control bg-dark text-white border-warning"
                            value={newPlan.features.dedicatedManager}
                            onChange={(e) =>
                              handleInputChange(e, true, "dedicatedManager")
                            }
                          />
                        </div>
                      </div>

                      <div className="text-end mt-3">
                        <button
                          className="btn btn-warning"
                          onClick={handleAddPlan}
                        >
                          <FaSave className="me-2" />
                          Save Plan
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Features</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.id}>
                          <td>{plan.id}</td>
                          <td>{plan.plan_type}</td>
                          <td>
                            {editingPlan && editingPlan.id === plan.id ? (
                              <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white border-warning"
                                name="plan_name"
                                value={editingPlan.plan_name}
                                onChange={(e) => handleEditInputChange(e)}
                              />
                            ) : (
                              plan.plan_name
                            )}
                          </td>
                          <td>
                            {editingPlan && editingPlan.id === plan.id ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control form-control-sm bg-dark text-white border-warning"
                                name="base_price"
                                value={editingPlan.base_price}
                                onChange={(e) => handleEditInputChange(e)}
                              />
                            ) : (
                              `$${plan.base_price}`
                            )}
                          </td>
                          <td>
                            {editingPlan && editingPlan.id === plan.id ? (
                              <div className="row row-cols-2 g-2">
                                {plan.features &&
                                  Object.entries(plan.features).map(
                                    ([key, value]) => (
                                      <div className="col" key={key}>
                                        <div className="input-group input-group-sm">
                                          <span className="input-group-text bg-dark text-white border-warning">
                                            {key}
                                          </span>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm bg-dark text-white border-warning"
                                            value={editingPlan.features[key]}
                                            onChange={(e) =>
                                              handleEditInputChange(e, true, key)
                                            }
                                          />
                                        </div>
                                      </div>
                                    )
                                  )}
                              </div>
                            ) : (
                              <div>
                                {plan.features &&
                                  Object.entries(plan.features).map(
                                    ([key, value]) => (
                                      <span
                                        key={key}
                                        className="badge bg-warning text-dark me-1 mb-1"
                                      >
                                        {key}: {value}
                                      </span>
                                    )
                                  )}
                              </div>
                            )}
                          </td>
                          <td>
                            {editingPlan && editingPlan.id === plan.id ? (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-success"
                                  onClick={handleSaveEdit}
                                >
                                  <FaSave />
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={handleCancelEdit}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-warning"
                                  onClick={() => handleEditClick(plan)}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="collection-status mt-4">
                  <h3 className="text-warning">Collection Status</h3>
                  <div className="table-responsive">
                    <table className="table table-dark table-hover">
                      <thead>
                        <tr>
                          <th>Plan Name</th>
                          <th>User</th>
                          <th>Type</th>
                          <th>Collection Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPurchases.map(plan => (
                          <tr key={plan.id}>
                            <td>{plan.plan_name}</td>
                            <td>{plan.username}</td>
                            <td>{plan.plan_type}</td>
                            <td>
                              {plan.plan_type === 'Algo Smart Investment' ? (
                                plan.subcategory === 'Income Flow Builder' ? (
                                  `${plan.months_collected || 0}/${getDurationInMonths(plan.duration)} months`
                                ) : (
                                  <>
                                    First Collection: {plan.first_collection_made ? '✓' : '✗'}<br />
                                    Final Collection: {plan.final_collection_made ? '✓' : '✗'}
                                  </>
                                )
                              ) : (
                                plan.is_collected ? 'Collected' : 'Pending'
                              )}
                            </td>
                            <td>
                              {!plan.is_collected && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handlePlanCollection(plan.id, plan.plan_type)}
                                >
                                  Mark as Collected
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wallets" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">User Wallet Balances</h1>
                </div>
                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Wallet Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletBalances.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>₹{user.wallet_balance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "withdrawals" && (
              <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom border-warning">
                  <h1 className="h2 text-warning">Withdrawal Requests</h1>
                </div>

                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Amount</th>
                        <th>Bank Details</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalRequests.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td>{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                          <td>
                            <strong>{withdrawal.username}</strong><br />
                            <small className="text-white">{withdrawal.email}</small>
                          </td>
                          <td>₹{withdrawal.amount.toFixed(2)}</td>
                          <td>
                            <strong>{withdrawal.bank_name}</strong><br />
                            <small>A/C: {withdrawal.account_number}</small><br />
                            <small>IFSC: {withdrawal.ifsc_code}</small><br />
                            <small>Name: {withdrawal.account_holder_name}</small>
                          </td>
                          <td>
                            <span className={`badge bg-${withdrawal.status === 'pending' ? 'warning' :
                              withdrawal.status === 'approved' ? 'success' : 'danger'
                              }`}>
                              {withdrawal.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {withdrawal.status === 'pending' && (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-success"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                >
                                  <FaCheck /> Approve
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                                >
                                  <FaBan /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const getDurationInMonths = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/(\d+)\s+(Month|Months|Year|Years)/i);
  if (!match) return 0;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.includes('year')) return amount * 12;
  if (unit.includes('month')) return amount;
  return 0;
};

export default AdminDashboard;
