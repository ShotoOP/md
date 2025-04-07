import React, { createContext, useState, useContext, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { auth } from "../firebase/config";
import axios from "axios";


// Update the api instance configuration
export const api = axios.create({
  baseURL: "http://localhost:8081",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token and handle payment requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Special handling for payment-related endpoints
    if (config.url?.includes('/create-order') || config.url?.includes('/verify-payment')) {
      config.headers['x-razorpay-signature'] = config.headers['x-razorpay-signature'] || '';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Update the response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = await auth.currentUser?.getIdToken(true);
        if (token) {
          localStorage.setItem('authToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Remove token and redirect to login if refresh fails
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncedUsers, setSyncedUsers] = useState(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('authToken', token);

          const provider = firebaseUser.providerData[0]?.providerId || 'firebase';

          const response = await api.post(
            "/firebase-auth",
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              emailVerified: firebaseUser.emailVerified,
              provider: provider
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const userData = {
            ...response.data,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: response.data.displayName || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: provider
          };

          setUser(userData);
          setSyncedUsers((prev) => new Set(prev).add(firebaseUser.uid));
        } catch (error) {
          console.error("Error syncing user with backend:", error?.response?.data || error);
          // Don't set user to null here, just log the error
          // The user can still use the app with Firebase authentication
        }
      } else {
        setUser(null);
        localStorage.removeItem('authToken');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(userCredential.user);
      if (username) {
        await updateProfile(userCredential.user, { displayName: username });
      }
      
      // Get token for the new user
      const token = await userCredential.user.getIdToken();
      
      try {
        await api.post(
          "/firebase-auth",
          {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: username || "",
            emailVerified: userCredential.user.emailVerified,
          }
        );
      } catch (error) {
        console.error("Error syncing new user with backend:", error);
      }
      return userCredential.user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // First try popup
      try {
        const result = await signInWithPopup(auth, provider);
        // If successful, return the user
        return result.user;
      } catch (popupError) {
        console.log('Popup signin failed:', popupError);
        
        // If popup fails, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.message.includes('cross-origin-opener-policy') ||
            popupError.name === 'PopupBlockedError') {
          console.log('Falling back to redirect method');
          await signInWithRedirect(auth, provider);
          return null; // Return null to indicate redirect flow
        }
        throw popupError;
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  };

  // Add a new effect to handle redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Redirect sign-in successful');
          const token = await result.user.getIdToken();
          localStorage.setItem('authToken', token);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        return true;
      } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
      }
    } else {
      throw new Error("No user is currently signed in");
    }
  };

  // Function to refresh the token
  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true); // Force refresh
        localStorage.setItem('authToken', token);
        return token;
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        googleSignIn,
        logout,
        resendVerificationEmail,
        loading,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
