// frontend/src/pages/VerifyEmail.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

function VerifyEmail() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing');
        return;
      }
      
      try {
        const response = await axios.get(`https://md-1-ga1n.onrender.com/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now log in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'An error occurred during verification');
      }
    };
    
    verifyEmail();
  }, [location, navigate]);
  
  return (
    <div>
      <Header />
      <div className="container mt-5 pt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="card-title mb-4">Email Verification</h3>
                
                {status === 'loading' && (
                  <div>
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Verifying your email...</p>
                  </div>
                )}
                
                {status === 'success' && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {message}
                    <p className="mt-2 small">Redirecting to login page...</p>
                  </div>
                )}
                
                {status === 'error' && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {message}
                    <div className="mt-3">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/login')}
                      >
                        Go to Login
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default VerifyEmail;
