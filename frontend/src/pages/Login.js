// frontend/src/pages/Login.js
import React, { useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Login.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [strengthLevel, setStrengthLevel] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleSignIn, user, resendVerificationEmail } = useAuth();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Check for verification success
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get("verified");

    if (verified === "true") {
      setMessage("Email verified successfully! You can now log in.");
    }
  }, [location]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const checkPasswordStrength = (password) => {
    setPassword(password);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await login(email, password);
      setMessage("Login successful");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      // Handle different Firebase error codes
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          setMessage("Invalid email or password");
          break;
        case "auth/invalid-email":
          setMessage("Invalid email format");
          break;
        case "auth/user-disabled":
          setMessage("This account has been disabled");
          break;
        case "auth/too-many-requests":
          setMessage("Too many failed login attempts. Please try again later");
          break;
        case "auth/email-not-verified":
          setMessage("Please verify your email before logging in");
          break;
        default:
          setMessage("An error occurred during login. Please try again");
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

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setMessage("Verification email sent. Please check your inbox");
    } catch (error) {
      setMessage("Failed to send verification email. Please try again");
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="Login">
      <Header></Header>
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
          <h3 className="text-center mb-2" style={{ color: "#FFD700" }}>
            MindStocs
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-2">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-2">
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
                  value={password}
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

            {/* Remember Me Checkbox */}
            <div className="mb-2 form-check">
              <input
                type="checkbox"
                className="form-check-input custom-checkbox"
                id="rememberMe"
              />
              <label
                className="form-check-label remember-me-label"
                htmlFor="rememberMe"
              >
                Remember Me
              </label>
            </div>

            {/* reCAPTCHA */}
            <div className="d-flex justify-content-centermy-2">
              <ReCAPTCHA
                sitekey="YOUR_RECAPTCHA_SITE_KEY"
                onChange={() => {}}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn w-100 custom-button"
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {message && (
            <div className="text-center-2" style={{ color: "#FFD700" }}>
              {message}
            </div>
          )}

          <div className="text-center" style={{ color: "#FFD700" }}>
            OR
          </div>

          {/* Social Login Buttons */}
          <button
            onClick={handleGoogleSignIn}
            className="btn w-100 mb-2 custom-button"
            disabled={loading}
          >
            <i className="bi bi-google me-2"></i> Login with Google
          </button>

          {/* Register Button */}
          <div className="text-center mt-3">
            <button
              className="btn custom-button"
              style={{ backgroundColor: "#FFD700", color: "#121212" }}
              onClick={handleRegisterClick}
            >
              New user? Register
            </button>
          </div>
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default Login;
