import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Check if user already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  // ✅ If logged in → show Dashboard
  if (isLoggedIn) {
    return <Dashboard />;
  }

  // ✅ Otherwise → show login/register pages
  return (
    <div>
      {showLogin ? (
        <Login onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <Register />
      )}

      <button
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: "8px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          backgroundColor: "#333",
          color: "white",
        }}
        onClick={() => setShowLogin(!showLogin)}
      >
        {showLogin ? "Go to Register" : "Go to Login"}
      </button>
    </div>
  );
}

export default App;
