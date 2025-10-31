import React, { useState } from "react";
import api from "../api/axiosConfig";

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      // 🔹 Send credentials to backend
      const response = await api.post("/api/auth/login", { email, password });

      // 🔹 Save JWT token in localStorage
      const token = response.data.token;
      if (!token) throw new Error("No token returned from server");

      localStorage.setItem("token", token);

      // ✅ Notify user and redirect
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard"; // Redirect after login
      }, 1000);
    } catch (err: any) {
      console.error("Login error:", err);
      setMessage("❌ " + (err.response?.data || "Invalid credentials"));
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", margin: "8px 0", padding: "8px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", margin: "8px 0", padding: "8px" }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#333",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
      <p style={{ marginTop: "10px" }}>{message}</p>
    </div>
  );
};

export default Login;
