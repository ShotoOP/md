import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        await axios.get(`${API_BASE_URL}/admin/stats`, {
          withCredentials: true,
        });
        navigate("/admin-dashboard");
      } catch (err) {}
    };

    const timeoutId = setTimeout(checkAdminStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/login`,
        credentials,
        { withCredentials: true }
      );
      if (response.data.status === "Admin login successful")
        navigate("/admin-dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          minHeight: "100vh",
          paddingTop: "80px",
          paddingBottom: "40px",
        }}
      >
        <div
          className="card p-4 text-white"
          style={{
            width: "400px",
            backgroundColor: "#1a1a1a",
            border: "1px solid #FFD700",
            borderRadius: "10px",
            boxShadow: "0 0 15px rgba(255, 215, 0, 0.3)",
          }}
        >
          <h3 className="text-center mb-4" style={{ color: "#FFD700" }}>
            Admin Login
          </h3>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#fff" }}>
                Username
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    backgroundColor: "#121212",
                    color: "#FFD700",
                    border: "1px solid #FFD700",
                  }}
                >
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                  ref={usernameRef}
                  style={{
                    backgroundColor: "black",
                    color: "#fff",
                    border: "1px solid #FFD700",
                  }}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label" style={{ color: "#fff" }}>
                Password
              </label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{
                    backgroundColor: "#121212",
                    color: "#FFD700",
                    border: "1px solid #FFD700",
                  }}
                >
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  style={{
                    backgroundColor: "black",
                    color: "#fff",
                    border: "1px solid #FFD700",
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn w-100 mb-3"
              style={{
                backgroundColor: "#FFD700",
                color: "#121212",
                fontWeight: "bold",
                border: "none",
                padding: "10px",
                borderRadius: "5px",
                transition: "0.3s",
              }}
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Logging in...
                </span>
              ) : (
                "Login as Admin"
              )}
            </button>
            <div className="text-center mt-3">
              <a
                href="/"
                className="text-warning"
                style={{ textDecoration: "none" }}
              >
                Return to Home
              </a>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AdminLogin;
