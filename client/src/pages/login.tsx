// client/src/pages/login.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#50C8E5]/10 to-[#125566]/10 p-4">
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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C8E5] transition-colors duration-200 placeholder-gray-400 text-gray-800"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C8E5] transition-colors duration-200 placeholder-gray-400 text-gray-800"
            />
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