import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => setShow(true), []);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Read the response as text first (always safe)
      const responseText = await response.text();

      let data;
      try {
        // Attempt to parse as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If it's not valid JSON, use the raw text as error message
        data = { error: responseText || "Server returned an invalid response" };
      }

      if (!response.ok) {
        // Use the error from JSON if available, otherwise a generic message
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      // Success – show message and navigate to OTP page
      setMessage(data.message || "OTP sent successfully!");
      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-blue-100 px-4">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 sm:top-5 sm:left-5 bg-blue-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-md font-medium shadow-md hover:bg-blue-700 transition cursor-pointer flex gap-1 items-center"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div
        className={`bg-white w-full max-w-md p-8 rounded-2xl shadow-xl transform transition-all duration-500 ease-out ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-gray-500 text-center mb-6">Enter your registered Email ID</p>

        {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
        {message && <div className="mb-4 text-green-600 text-center">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-3 rounded-xl hover:bg-blue-800 transition cursor-pointer font-medium disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;