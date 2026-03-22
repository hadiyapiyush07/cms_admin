// File: src/cms_admin/pages/AdminSignIn.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const AdminSignIn = () => {
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  // Reset fields on every visit to this page
  useEffect(() => {
    setEmail("");
    setPassword("");
    setApiError("");
    setErrors({});
  }, [location.key]);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  const validate = () => {
    let err = {};
    setApiError("");

    if (!email.trim()) {
      err.email = "Please fill this input";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      err.password = "Please fill this input";
    } else if (password.length < 8) {
      err.password = "Password must be at least 8 characters";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const authenticateAdmin = async () => {
    setLoading(true);
    setApiError("");

    try {
      const endpoint = "http://localhost:5000/api/auth/admin/login";
      const payload = { email, password };

      console.log("📡 Sending request to:", endpoint);
      console.log("📦 Payload:", payload);

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log("✅ Response received:", response.data);

      // if (response.data.success) {
      //   // Store token as 'authToken' for consistency across the app
      //   localStorage.setItem('authToken', response.data.token);
      //   localStorage.setItem('adminData', JSON.stringify(response.data.user));
      //   navigate('/admin');
      // } 
      if (response.data.success) {
          const token = response.data.token; // or response.data.data.token
          // Store token for axios interceptor (key must be 'token')
          localStorage.setItem('token', token);
          // Also keep authToken for any existing code that relies on it
          localStorage.setItem('authToken', token);
          // Store admin data
          localStorage.setItem('adminData', JSON.stringify(response.data.user));
          // Set user role for frontend and backend middleware
          localStorage.setItem('userRole', 'admin');
          navigate('/admin')
          // Optionally redirect or update state
      }
      else {
        setApiError(response.data.message || "Authentication failed");
      }

    } catch (error) {
      console.error("❌ Login error:", error);

      if (error.code === 'ECONNABORTED') {
        setApiError("Request timeout. Please try again.");
      } else if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;

        if (status === 401) {
          setApiError("Invalid email or password");
        } else if (status === 404) {
          setApiError("Login endpoint not found");
        } else if (status === 500) {
          setApiError("Server error. Please try again later.");
        } else {
          setApiError(message || `Error ${status}: Login failed`);
        }
      } else if (error.request) {
        setApiError("Cannot connect to server. Please check if backend is running.");
      } else {
        setApiError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (validate()) {
      await authenticateAdmin();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center
      bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 px-4 sm:px-6">

      <div className={`bg-white rounded-3xl shadow-2xl
        p-6 sm:p-8 lg:p-10
        w-full max-w-[420px]
        transition-all duration-700 ease-out
        ${show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}>

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-blue-950">
          Admin Login
        </h2>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{apiError}</p>
          </div>
        )}

        <div className="mb-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Admin Email"
            autoComplete="off"
            className={`w-full border rounded-xl
            px-4 py-2.5 sm:py-3 text-sm outline-none mb-3
            focus:ring-2 focus:ring-blue-500
            ${errors.email ? "border-red-500" : ""}
            ${loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Password"
              autoComplete="new-password"
              className={`w-full border rounded-xl
              px-4 py-2.5 sm:py-3 pr-12 text-sm outline-none
              focus:ring-2 focus:ring-blue-500
              ${errors.password ? "border-red-500" : ""}
              ${loading ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-4 top-1/2 -translate-y-1/2
              text-gray-500 hover:text-blue-700 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full bg-blue-950 text-white
          py-2.5 sm:py-3 rounded-xl font-semibold
          transition cursor-pointer
          ${loading
            ? "opacity-70 cursor-not-allowed hover:scale-100"
            : "hover:scale-[1.03]"}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </span>
          ) : (
            "Login as Admin"
          )}
        </button>

        <div className="flex justify-center sm:justify-end mb-5">
          <button
            onClick={() => navigate("/forgot-password")}
            disabled={loading}
            className="text-l text-blue-900 pt-2 cursor-pointer
            hover:underline transition duration-200
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Forgot Password?
          </button>
        </div>

        {/* Simple footer only */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Campus Flow • Secure Admin Login Portal
        </p>
      </div>
    </div>
  );
};

export default AdminSignIn;