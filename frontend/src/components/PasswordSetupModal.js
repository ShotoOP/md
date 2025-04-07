import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const PasswordSetupModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        'http://localhost:8081/setup-password',
        {
          uid: user.id,
          email: user.email,
          password: password
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.data.status === 'success') {
        alert('Password setup successful!');
        if (typeof onClose === 'function') {
          onClose(response.data);
        }
      } else {
        throw new Error(response.data.error || 'Failed to set password');
      }
    } catch (err) {
      console.error('Password setup error:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to set password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header border-warning">
            <h5 className="modal-title text-warning">Set Up Password</h5>
          </div>
          <div className="modal-body">
            <p>Please set up a password to enable email/password login in the future.</p>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-white border-warning"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-white border-warning"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupModal;
