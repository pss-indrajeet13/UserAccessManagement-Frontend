// src/pages/login.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- NEW
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    setLoading(true);
    // Basic client-side validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    let hasClientError = false;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      hasClientError = true;
    }
    if (!password || password.length < 4) {
      // minimal password length check for UX; actual auth still enforced by Firebase
      setPasswordError('Please enter your password.');
      hasClientError = true;
    }
    if (hasClientError) {
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      // Normalize message and code
      const code: string | undefined = err?.code;
      const message: string = String(err?.message || "").toLowerCase();

      // Some backends may return generic messages like INVALID_LOGIN_CREDENTIALS
      if (message.includes('invalid_login_credentials') || message.includes('invalid login') || message.includes('invalid_login') || message.includes('invalid_credentials') || message.includes('invalid password')) {
        // We don't know which field is incorrect, so show a clear message on both
        setEmailError('Email or password is incorrect.');
        setPasswordError('Email or password is incorrect.');
      } else if (code) {
        switch (code) {
          case 'auth/user-not-found':
            setEmailError('Email not found. Please check and try again.');
            break;
          case 'auth/invalid-email':
            setEmailError('Invalid email address.');
            break;
          case 'auth/wrong-password':
            setPasswordError('Incorrect password.');
            break;
          case 'auth/network-request-failed':
            setError('Network error. Check your internet connection and try again.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.');
            break;
          default:
            setError(err.message || 'Login failed.');
            break;
        }
      } else {
        setError(err?.message || 'Login failed.');
      }
    }
    setLoading(false);
  };

  // const handlePrivacyClick = () => {
  //   setLocation("/privacy"); // Adjust the route to match your privacy page path
  // };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#50C8E5]/10 to-[#125566]/10 p-4 relative">
      {/* Privacy Button - Positioned at top right outside the container */}
      {/* <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={handlePrivacyClick}
          className="text-[#50C8E5] underline hover:text-[#125566] transition-colors duration-200 font-medium"
        >
          Privacy Policy
        </button>
      </div> */}

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transform transition-all duration-300 hover:shadow-2xl">
        <h2 className="text-2xl font-bold text-[#125566] mb-2 text-center">Welcome Back</h2>
        <p className="text-gray-600 mb-6 text-center">Please enter your details to sign in.</p>

        {error && (
          <p className="text-red-500 mb-4 text-center bg-red-50 p-2 rounded">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(''); }}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C8E5] transition-colors duration-200 placeholder-gray-400 text-gray-800"
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setError(''); }}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C8E5] transition-colors duration-200 placeholder-gray-400 text-gray-800 pr-10"
            />
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                // Eye open icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Eye closed icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.249-2.383A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 bg-[#125566] text-white rounded-lg font-medium hover:bg-[#5FB3B3] transition-colors duration-200 ${
              loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
