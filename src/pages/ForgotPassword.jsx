// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .fp-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .fp-root {
    font-family: 'Outfit', sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%);
    padding: 1rem; position: relative; overflow: hidden;
  }

  /* Decorative blobs */
  .fp-blob1 {
    position: absolute; width: 520px; height: 520px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
    top: -160px; right: -120px; pointer-events: none;
  }
  .fp-blob2 {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
    bottom: -120px; left: -100px; pointer-events: none;
  }

  /* Back button */
  .fp-back-btn {
    position: absolute; top: 1.25rem; left: 1.25rem; z-index: 10;
    display: flex; align-items: center; gap: 0.4rem;
    background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.85); font-size: 0.82rem; font-weight: 600;
    padding: 0.45rem 1rem; border-radius: 10px; cursor: pointer;
    font-family: 'Outfit', sans-serif; transition: all 0.2s; backdrop-filter: blur(4px);
  }
  .fp-back-btn:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.35); }

  /* Card */
  .fp-card {
    position: relative; z-index: 1;
    background: rgba(255,255,255,0.97);
    border-radius: 24px; padding: 2.5rem 2.25rem;
    width: 100%; max-width: 420px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    transform: translateY(20px) scale(0.97); opacity: 0;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .fp-card.show { transform: translateY(0) scale(1); opacity: 1; }

  /* Icon */
  .fp-icon {
    width: 58px; height: 58px; border-radius: 17px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem; font-size: 1.65rem;
    box-shadow: 0 6px 22px rgba(99,102,241,0.4);
  }

  .fp-title    { font-size: 1.55rem; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 0.35rem; letter-spacing: -0.02em; }
  .fp-subtitle { font-size: 0.85rem; color: #6b7280; text-align: center; margin-bottom: 1.75rem; line-height: 1.5; }

  /* Alerts */
  .fp-alert { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.25rem; }
  .fp-alert.error   { background: #fff1f2; border: 1.5px solid #fecdd3; color: #dc2626; }
  .fp-alert.success { background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #15803d; }

  /* Form */
  .fp-label {
    display: block; font-size: 0.75rem; font-weight: 700;
    color: #374151; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem;
  }
  .fp-input {
    width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px;
    padding: 0.82rem 1rem; font-size: 0.9rem; font-family: 'Outfit', sans-serif;
    color: #0f172a; background: #f9fafb; outline: none; transition: all 0.2s;
    margin-bottom: 1.25rem;
  }
  .fp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .fp-input:disabled { opacity: 0.55; cursor: not-allowed; }

  .fp-submit {
    width: 100%; padding: 0.88rem; border: none; border-radius: 12px; cursor: pointer;
    font-size: 0.95rem; font-weight: 700; font-family: 'Outfit', sans-serif;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    color: #fff; transition: all 0.2s; box-shadow: 0 4px 18px rgba(99,102,241,0.38);
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .fp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(99,102,241,0.48); }
  .fp-submit:active:not(:disabled) { transform: translateY(0); }
  .fp-submit:disabled { opacity: 0.52; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Spinner */
  .fp-spin {
    width: 17px; height: 17px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: fp-spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes fp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 440px) { .fp-card { padding: 2rem 1.25rem; } }
`;

/* ─── Component ─────────────────────────────────────────────────────────── */
const ForgotPassword = () => {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [message, setMessage] = useState("");
  const [show,    setShow]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => setShow(true), []);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (!email)             { setError("Email is required"); return; }
    if (!isValidEmail(email)) { setError("Enter a valid email address"); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Read as text first (always safe)
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); }
      catch { data = { error: responseText || "Server returned an invalid response" }; }

      if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);

      setMessage(data.message || "OTP sent successfully!");
      setTimeout(() => navigate("/verify-otp", { state: { email } }), 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fp-root">
        {/* Blobs */}
        <div className="fp-blob1" />
        <div className="fp-blob2" />

        {/* Back button */}
        <button className="fp-back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={15} /> Back to Login
        </button>

        {/* Card */}
        <div className={`fp-card${show ? ' show' : ''}`}>
          <div className="fp-icon">🔐</div>
          <div className="fp-title">Forgot Password</div>
          <div className="fp-subtitle">Enter your registered email address and we'll send you an OTP to reset your password.</div>

          {error   && <div className="fp-alert error">⚠&nbsp; {error}</div>}
          {message && <div className="fp-alert success">✓&nbsp; {message}</div>}

          <form onSubmit={handleSubmit}>
            <label className="fp-label">Email Address</label>
            <input
              type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="fp-input" disabled={loading}
            />
            <button type="submit" className="fp-submit" disabled={loading}>
              {loading ? <><span className="fp-spin" /> Sending OTP…</> : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
