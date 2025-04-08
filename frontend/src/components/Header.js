import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Header.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Header() {
  const { user, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        await axios.get("https://md-url.onrender.com/admin/stats", {
          withCredentials: true,
        });
        setIsAdmin(true);
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleAdminLogout = async () => {
    try {
      await axios.post(
        "https://md-url.onrender.com/admin/logout",
        {},
        { withCredentials: true }
      );
      setIsAdmin(false);
      navigate("/admin-login");
    } catch (err) {
      console.error("Admin logout failed:", err);
    }
  };

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
  const closeNavMenu = () => setIsNavCollapsed(true);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top bg-dark px-3">
      <Link
        className="navbar-brand text-warning fw-bold mx-2"
        to="/"
        onClick={closeNavMenu}
      >
        MindStocs
      </Link>
      <button
        className="navbar-toggler me-2"
        type="button"
        onClick={handleNavCollapse}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className={`${isNavCollapsed ? "collapse" : ""} navbar-collapse`}>
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 me-3">
          <li className="nav-item mx-1">
            <Link
              className="nav-link fw-bold py-2"
              to="/"
              onClick={closeNavMenu}
            >
              Home
            </Link>
          </li>
          <li className="nav-item mx-1">
            <Link
              className="nav-link fw-bold py-2"
              to="/about"
              onClick={closeNavMenu}
            >
              About
            </Link>
          </li>
          <li className="nav-item mx-1">
            <Link
              className="nav-link fw-bold py-2"
              to="/plan"
              onClick={closeNavMenu}
            >
              Plans & Pricing
            </Link>
          </li>
          <li className="nav-item dropdown mx-1">
            <Link
              className="nav-link dropdown-toggle fw-bold py-2"
              id="servicesDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Services
            </Link>
            <ul className="dropdown-menu" aria-labelledby="servicesDropdown">
              <li>
                <Link
                  className="dropdown-item"
                  to="/services/algosoft"
                  onClick={closeNavMenu}
                >
                  Algo Software
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/services/indictor"
                  onClick={closeNavMenu}
                >
                  Algo Indicator
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  to="/services/algosamrt"
                  onClick={closeNavMenu}
                >
                  Algo Smart Investment
                </Link>
              </li>
            </ul>
          </li>
          <li className="nav-item mx-1">
            <Link
              className="nav-link fw-bold py-2"
              to="/contact-us" // Updated route
              onClick={closeNavMenu}
            >
              Contact Us
            </Link>
          </li>

          {isAdmin && (
            <li className="nav-item dropdown mx-1">
              <button
                className="btn btn-outline-warning dropdown-toggle fw-bold py-2"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-shield-lock me-1"></i> Admin
              </button>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/admin-dashboard">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleAdminLogout}>
                    Admin Logout
                  </button>
                </li>
              </ul>
            </li>
          )}

          {user ? (
            <li className="nav-item dropdown mx-1">
              <button
                className="btn btn-outline-warning me-lg-2 mb-2 mb-lg-0"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle me-2"></i>
                {user.displayName || user.email}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/user-dashboard">
                    Profile
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={logout}>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          ) : (
            !isAdmin && (
              <li className="nav-item mt-2 mt-lg-0 mx-1">
                <div className="d-flex flex-column flex-lg-row mt-3 mt-lg-0">
                  <Link
                    to="/login"
                    className="btn btn-outline-warning me-lg-2 mb-2 mb-lg-0"
                  >
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-warning">
                    Register
                  </Link>
                </div>
              </li>
            )
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Header;
