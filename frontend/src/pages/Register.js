// frontend/src/pages/Register.js
import React, { useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Register() {
  const [values, setValues] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [strengthLevel, setStrengthLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const navigate = useNavigate();
  const { register, googleSignIn, user } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const checkPasswordStrength = (password) => {
    setValues((prevValues) => ({ ...prevValues, password }));
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) strength++;
    if (
      password.match(/[A-Z]/) &&
      password.match(/[0-9]/) &&
      password.match(/[@$!%*?&]/)
    )
      strength++;

    setStrengthLevel(strength);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prevValues) => ({ ...prevValues, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate passwords match
    if (values.password !== values.confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await register(values.email, values.password, values.username);
      setRegistrationSuccess(true);
      setRegisteredEmail(values.email);
    } catch (error) {
      console.error("Registration error:", error);

      // Handle different Firebase error codes
      switch (error.code) {
        case "auth/email-already-in-use":
          setMessage("Email is already in use");
          break;
        case "auth/invalid-email":
          setMessage("Invalid email format");
          break;
        case "auth/weak-password":
          setMessage("Password is too weak");
          break;
        default:
          setMessage("Registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await googleSignIn();
      if (!result) {
        // If null is returned, we're using redirect flow
        setMessage("Redirecting to Google sign-in...");
        return; // Don't set loading to false as we're redirecting
      }
      // Success case for popup flow will be handled by auth state change
    } catch (error) {
      console.error("Google sign-in error:", error);
      setMessage(
        error.code === 'auth/popup-closed-by-user' 
          ? "Sign-in cancelled" 
          : "Unable to sign in with Google. Please try again."
      );
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="Register">
      <Header></Header>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div
          className="card p-4 text-white"
          style={{
            width: "350px",
            backgroundColor: "#1a1a1a",
            border: "1px solid #FFD700",
            borderRadius: "10px",
          }}
        >
          <h3 className="text-centermb-3" style={{ color: "#FFD700" }}>
            Create Account
          </h3>

          {!registrationSuccess ? (
            <form onSubmit={handleSubmit}>
              {/* Full Name Field */}
              <div className="mb-3">
                <label className="form-label" style={{ color: "#FFD700" }}>
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-group-text custom-input-icon">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="Enter full name"
                    required
                    name="username"
                    value={values.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="mb-3">
                <label className="form-label" style={{ color: "#FFD700" }}>
                  Email
                </label>
                <div className="input-group">
                  <span className="input-group-text custom-input-icon">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control custom-input"
                    placeholder="Enter email"
                    required
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label className="form-label" style={{ color: "#FFD700" }}>
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text custom-input-icon">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control custom-input"
                    placeholder="Enter password"
                    required
                    name="password"
                    value={values.password}
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                  />
                  <span
                    className="input-group-text custom-input-icon password-toggle"
                    onClick={togglePasswordVisibility}
                    style={{ cursor: "pointer" }}
                  >
                    <i
                      className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
                    ></i>
                  </span>
                </div>

                {/* Password Strength Bar */}
                <div className="strength-bar">
                  <div
                    className={`strength-indicator level-${strengthLevel}`}
                  ></div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-3">
                <label className="form-label" style={{ color: "#FFD700" }}>
                  Confirm Password
                </label>
                <div className="input-group">
                  <span className="input-group-text custom-input-icon">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control custom-input"
                    placeholder="Confirm password"
                    required
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input custom-checkbox"
                  id="agreeTerms"
                  required
                />
                <label
                  className="form-check-label remember-me-label"
                  htmlFor="agreeTerms"
                  style={{ color: "#FFD700" }}
                >
                  I agree to the Terms & Conditions
                </label>
              </div>

              {/* reCAPTCHA */}
              <div className="d-flex justify-content-center">
                <ReCAPTCHA
                  sitekey="YOUR_RECAPTCHA_SITE_KEY"
                  onChange={() => {}}
                />
              </div>

              {message && (
                <div className="alert alert-danger" role="alert">
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 custom-button"
                style={{ backgroundColor: "#FFD700", color: "#121212" }}
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Registering...
                  </span>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          ) : (
            <div className="mt-3 p-3 border border-success rounded">
              <h4 className="text-success">Registration Successful!</h4>
              <p className="text-white">
                We've sent a verification email to{" "}
                <strong>{registeredEmail}</strong>. Please check your inbox and
                click the verification link to activate your account.
              </p>
              <p className="text-white small">
                If you don't see the email, please check your spam folder.
              </p>
            </div>
          )}

          <div className="text-center" style={{ color: "#FFD700" }}>
            OR
          </div>

          {/* Social Login Buttons */}
          <button
            onClick={handleGoogleSignIn}
            className="btn w-100 mb-3 custom-button"
            style={{ backgroundColor: "#DB4437", color: "#fff" }}
            disabled={loading}
          >
            <i className="bi bi-google me-2"></i> Sign Up with Google
          </button>

          {/* Login Button */}
          <div className="text-center mt-3">
            <button
              className="btn custom-button"
              style={{ backgroundColor: "#FFD700", color: "#121212" }}
              onClick={handleLoginClick}
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
      <br></br>
      <br></br>
      <br></br>
      <Footer></Footer>
    </div>
  );
}

export default Register;
