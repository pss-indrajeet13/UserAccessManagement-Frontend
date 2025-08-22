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
      setLocation("/dashboard"); // redirect after successful login
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#e9e7f0",
      padding: 20,
    }}>
      <div style={{
        background: "#fff",
        padding: "40px",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        width: "100%",
        maxWidth: 400,
        textAlign: "center",
      }}>
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>Welcome back</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>Please enter your details.</p>

        {error && <p style={{ color: "red", marginBottom: 15 }}>{error}</p>}

        <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              border: "1px solid #ccc",
              borderRadius: 5,
              fontSize: 14,
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: 15,
              border: "1px solid #ccc",
              borderRadius: 5,
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#6b48ff",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
