// src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .rp-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .rp-root {
    font-family: 'Outfit', sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%);
    padding: 1rem; position: relative; overflow: hidden;
  }
  .rp-blob1 {
    position: absolute; width: 520px; height: 520px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
    top: -160px; right: -120px; pointer-events: none;
  }
  .rp-blob2 {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%);
    bottom: -120px; left: -100px; pointer-events: none;
  }

  .rp-card {
    position: relative; z-index: 1;
    background: rgba(255,255,255,0.97); border-radius: 24px;
    padding: 2.5rem 2.25rem; width: 100%; max-width: 420px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.4);
    transform: translateY(20px) scale(0.97); opacity: 0;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .rp-card.show { transform: translateY(0) scale(1); opacity: 1; }

  .rp-icon {
    width: 58px; height: 58px; border-radius: 17px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem; font-size: 1.65rem;
    box-shadow: 0 6px 22px rgba(99,102,241,0.4);
  }
  .rp-title    { font-size: 1.55rem; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 0.35rem; letter-spacing: -0.02em; }
  .rp-subtitle { font-size: 0.85rem; color: #6b7280; text-align: center; margin-bottom: 1.75rem; }

  .rp-alert { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.25rem; }
  .rp-alert.error   { background: #fff1f2; border: 1.5px solid #fecdd3; color: #dc2626; }
  .rp-alert.success { background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #15803d; }

  /* Field */
  .rp-field   { margin-bottom: 1.1rem; }
  .rp-label   { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem; }
  .rp-wrap    { position: relative; }
  .rp-input {
    width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px;
    padding: 0.82rem 2.8rem 0.82rem 1rem;
    font-size: 0.9rem; font-family: 'Outfit', sans-serif;
    color: #0f172a; background: #f9fafb; outline: none; transition: all 0.2s;
  }
  .rp-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .rp-input:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Eye toggle */
  .rp-eye {
    position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #9ca3af; font-size: 1.05rem; display: flex; align-items: center;
    padding: 0; transition: color 0.2s; line-height: 1;
  }
  .rp-eye:hover { color: #6366f1; }

  /* Password strength bars */
  .rp-strength { display: flex; gap: 5px; margin-top: 0.45rem; }
  .rp-bar { height: 3px; flex: 1; border-radius: 99px; background: #e5e7eb; transition: background 0.35s; }
  .rp-bar.weak   { background: #ef4444; }
  .rp-bar.medium { background: #f97316; }
  .rp-bar.strong { background: #10b981; }

  /* Match indicator */
  .rp-match { font-size: 0.75rem; margin-top: 0.4rem; font-weight: 500; }
  .rp-match.ok  { color: #15803d; }
  .rp-match.bad { color: #dc2626; }

  .rp-submit {
    width: 100%; padding: 0.88rem; border: none; border-radius: 12px; cursor: pointer;
    font-size: 0.95rem; font-weight: 700; font-family: 'Outfit', sans-serif; margin-top: 0.25rem;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    color: #fff; transition: all 0.2s; box-shadow: 0 4px 18px rgba(99,102,241,0.38);
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .rp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(99,102,241,0.48); }
  .rp-submit:disabled { opacity: 0.52; cursor: not-allowed; transform: none; box-shadow: none; }

  .rp-spin {
    width: 17px; height: 17px; border-radius: 50%;
    border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: rp-spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 440px) { .rp-card { padding: 2rem 1.25rem; } }
`;

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const strengthScore = (pwd) => {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6)  s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd) && /[0-9!@#$%^&*]/.test(pwd)) s++;
  return s;          // 0 = none, 1 = weak, 2 = medium, 3 = strong
};
const strengthLabel = ['', 'weak', 'medium', 'strong'];

/* Eye-toggle input */
const PwdInput = ({ placeholder, value, onChange, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="rp-wrap">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value} onChange={onChange}
        className="rp-input" disabled={disabled}
      />
      <button type="button" className="rp-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
};

/* ─── Component ─────────────────────────────────────────────────────────── */
const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [message,  setMessage]  = useState("");
  const [show,     setShow]     = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};

  useEffect(() => setShow(true), []);

  // Your original guard
  if (!email || !resetToken) { navigate("/forgot-password"); return null; }

  const score   = strengthScore(password);
  const strCls  = strengthLabel[score];
  const matched = confirm && password === confirm;

  const handleReset = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (!password || !confirm) { setError("Fill all fields"); return; }
    if (password !== confirm)   { setError("Passwords do not match"); return; }
    if (password.length < 6)    { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Password reset failed");

      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rp-root">
        <div className="rp-blob1" />
        <div className="rp-blob2" />

        <div className={`rp-card${show ? ' show' : ''}`}>
          <div className="rp-icon">🔑</div>
          <div className="rp-title">Reset Password</div>
          <div className="rp-subtitle">Choose a strong new password for your account</div>

          {error   && <div className="rp-alert error">⚠&nbsp; {error}</div>}
          {message && <div className="rp-alert success">✓&nbsp; {message}</div>}

          <form onSubmit={handleReset}>
            {/* New Password */}
            <div className="rp-field">
              <label className="rp-label">New Password</label>
              <PwdInput
                placeholder="Min 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {/* Strength bars */}
              {password.length > 0 && (
                <div className="rp-strength">
                  {[1, 2, 3].map((lvl) => (
                    <div key={lvl} className={`rp-bar${score >= lvl ? ' ' + strCls : ''}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="rp-field">
              <label className="rp-label">Confirm Password</label>
              <PwdInput
                placeholder="Repeat new password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
              {/* Match indicator */}
              {confirm.length > 0 && (
                <div className={`rp-match${matched ? ' ok' : ' bad'}`}>
                  {matched ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <button type="submit" className="rp-submit" disabled={loading}>
              {loading ? <><span className="rp-spin" /> Updating…</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
