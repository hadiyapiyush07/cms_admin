// src/pages/VerifyOTP.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .vo-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .vo-root {
    font-family: 'Outfit', sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%);
    padding: 1rem; position: relative; overflow: hidden;
  }
  .vo-blob1 {
    position: absolute; width: 520px; height: 520px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
    top: -160px; right: -120px; pointer-events: none;
  }
  .vo-blob2 {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
    bottom: -120px; left: -100px; pointer-events: none;
  }

  .vo-card {
    position: relative; z-index: 1;
    background: rgba(255,255,255,0.97); border-radius: 24px;
    padding: 2.5rem 2.25rem; width: 100%; max-width: 420px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    transform: translateY(20px) scale(0.97); opacity: 0;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .vo-card.show { transform: translateY(0) scale(1); opacity: 1; }

  .vo-icon {
    width: 58px; height: 58px; border-radius: 17px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem; font-size: 1.65rem;
    box-shadow: 0 6px 22px rgba(99,102,241,0.4);
  }

  .vo-title    { font-size: 1.55rem; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 0.35rem; letter-spacing: -0.02em; }
  .vo-subtitle { font-size: 0.85rem; color: #6b7280; text-align: center; margin-bottom: 1.75rem; line-height: 1.6; }
  .vo-email    { color: #6366f1; font-weight: 700; }

  .vo-alert { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.25rem; }
  .vo-alert.error   { background: #fff1f2; border: 1.5px solid #fecdd3; color: #dc2626; }
  .vo-alert.success { background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #15803d; }

  /* 6-box OTP */
  .vo-otp-row {
    display: flex; gap: 0.55rem; justify-content: center;
    margin-bottom: 1.5rem;
  }
  .vo-otp-box {
    width: 50px; height: 58px; border: 2px solid #e5e7eb; border-radius: 13px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.5rem; font-weight: 700; color: #0f172a;
    text-align: center; background: #f9fafb;
    transition: all 0.2s; outline: none; caret-color: #6366f1;
  }
  .vo-otp-box:focus {
    border-color: #6366f1; background: #fff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    transform: scale(1.06);
  }
  .vo-otp-box.filled { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
  .vo-otp-box:disabled { opacity: 0.5; cursor: not-allowed; }

  .vo-submit {
    width: 100%; padding: 0.88rem; border: none; border-radius: 12px; cursor: pointer;
    font-size: 0.95rem; font-weight: 700; font-family: 'Outfit', sans-serif;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    color: #fff; transition: all 0.2s; box-shadow: 0 4px 18px rgba(99,102,241,0.38);
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .vo-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(99,102,241,0.48); }
  .vo-submit:disabled { opacity: 0.52; cursor: not-allowed; transform: none; box-shadow: none; }

  .vo-back {
    width: 100%; margin-top: 1rem; padding: 0; border: none; background: none;
    font-family: 'Outfit', sans-serif; font-size: 0.82rem; font-weight: 500;
    color: #6b7280; cursor: pointer; transition: color 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 0.3rem;
  }
  .vo-back:hover { color: #6366f1; }

  .vo-spin {
    width: 17px; height: 17px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: vo-spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes vo-spin { to { transform: rotate(360deg); } }

  @media (max-width: 440px) {
    .vo-card { padding: 2rem 1rem; }
    .vo-otp-box { width: 42px; height: 50px; font-size: 1.25rem; }
  }
`;

/* ─── Component ─────────────────────────────────────────────────────────── */
const VerifyOTP = () => {
  const [digits,  setDigits]  = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [message, setMessage] = useState("");
  const [show,    setShow]    = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // One ref per digit box
  const refs = Array.from({ length: 6 }, () => useRef(null));

  useEffect(() => {
    setShow(true);
    setTimeout(() => refs[0]?.current?.focus(), 150);
  }, []);

  if (!email) { navigate("/forgot-password"); return null; }

  // Build the OTP string from digits array
  const otp = digits.join('');

  /* Handle individual digit boxes */
  const handleDigit = (idx, val) => {
    if (!/^\d?$/.test(val)) return;             // only digits
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) refs[idx + 1]?.current?.focus(); // auto-advance
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0)
      refs[idx - 1]?.current?.focus();           // go back on empty backspace
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setDigits(next);
    refs[Math.min(pasted.length, 5)]?.current?.focus();
    e.preventDefault();
  };

  /* Submit — your original logic exactly */
  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (otp.length !== 6) { setError("Enter 6-digit OTP"); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");

      setMessage("OTP verified! Redirecting...");
      setTimeout(() => {
        navigate("/reset-password", { state: { email, resetToken: data.resetToken } });
      }, 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="vo-root">
        <div className="vo-blob1" />
        <div className="vo-blob2" />

        <div className={`vo-card${show ? ' show' : ''}`}>
          <div className="vo-icon">✉️</div>
          <div className="vo-title">Verify OTP</div>
          <div className="vo-subtitle">
            OTP has been sent to <span className="vo-email">{email}</span><br />
            Enter the 6-digit code below
          </div>

          {error   && <div className="vo-alert error">⚠&nbsp; {error}</div>}
          {message && <div className="vo-alert success">✓&nbsp; {message}</div>}

          <form onSubmit={handleVerify}>
            {/* 6 individual digit boxes */}
            <div className="vo-otp-row" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={refs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`vo-otp-box${d ? ' filled' : ''}`}
                  disabled={loading}
                />
              ))}
            </div>

            <button type="submit" className="vo-submit" disabled={loading || otp.length < 6}>
              {loading ? <><span className="vo-spin" /> Verifying…</> : 'Verify OTP'}
            </button>
          </form>

          <button className="vo-back" onClick={() => navigate("/forgot-password")}>
            ← Back to Forgot Password
          </button>
        </div>
      </div>
    </>
  );
};

export default VerifyOTP;
