// frontend/src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import Preloader from "./components/Preloader";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Header from "./components/Header";
import Register from "./pages/Register";
import Plan from "./pages/Plan";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import AdminLogin from "./pages/AdminLogin"; // Import the correct component
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaymentPage from "./pages/PaymentPage";
import { AuthProvider } from "./context/AuthContext";
import Algosoft from "./pages/algosoft";
import Algosindi from "./pages/algoindi";
import Smartinvest from "./pages/smartinvest";
import VerifyEmail from "./pages/VerifyEmail";
import StarsBackground from "./StarsBackground";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, []);

  return loading ? (
    <Preloader />
  ) : (
    <div className="App">
      <StarsBackground />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/header" element={<Header />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/admin-login" element={<AdminLogin />} />{" "}
            {/* Use the correct component */}
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/algosoft" element={<Algosoft />} />
            <Route path="/algoindi" element={<Algosindi />} />
            <Route path="/smartinvest" element={<Smartinvest />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
