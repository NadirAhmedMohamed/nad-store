import React, { useState } from "react";
import "./Login.css";

import { auth } from "../../firebase.config.js";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { Link, useNavigate } from "react-router-dom";

import {
  FaGoogle,
  FaStore,
  FaUserShield,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const isBusy = loading || googleLoading;

  // Sign in with email and password
  const signIn = async (e) => {
    e.preventDefault();

    if (isBusy) return;

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err.code, err.message);

      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Incorrect email or password. Please try again.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;

        case "auth/network-request-failed":
          setError("Network error. Check your internet connection.");
          break;

        default:
          setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    if (isBusy) return;

    setError("");
    setGoogleLoading(true);

    try {
      await signInWithPopup(auth, provider);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);

      switch (err.code) {
        case "auth/popup-closed-by-user":
          setError("Google sign-in was cancelled.");
          break;

        case "auth/popup-blocked":
          setError("Your browser blocked the Google sign-in popup.");
          break;

        case "auth/network-request-failed":
          setError("Network error. Check your internet connection.");
          break;

        default:
          setError("Unable to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="login-container" dir="ltr">
      <div className="login-content">
        {/* Brand */}
        <Link to="/" className="login-brand" aria-label="Nad Store Home">
          <div className="login-brand-logo">
            <FaStore />
          </div>

          <div className="login-brand-text">
            <h1>
              Nad <span>Store</span>
            </h1>

            <p>Welcome back to Nad Store</p>
          </div>
        </Link>

        {/* Login Card */}
        <section className="login-card">
          <div className="login-heading">
            <h2>Welcome Back</h2>
            <p>Sign in to continue shopping with us.</p>
          </div>

          <form onSubmit={signIn}>
            {/* Email */}
            <div className="login-field">
              <label htmlFor="login-email">Email Address</label>

              <div className="login-input-wrap">
                <FaEnvelope className="login-input-icon" aria-hidden="true" />

                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  disabled={isBusy}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password">Password</label>

              <div className="login-input-wrap">
                <FaLock className="login-input-icon" aria-hidden="true" />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                  disabled={isBusy}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  disabled={isBusy}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-submit"
              disabled={isBusy || !email.trim() || !password}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="login-terms">
            By continuing, you agree to Nad Store's{" "}
            <span>Conditions of Use</span> and <span>Privacy Notice</span>.
          </p>

          {/* Register */}
          <div className="login-register">
            <div className="login-register-divider">
              <span>NEW TO NAD STORE?</span>
            </div>

            <Link to="/register" className="create-account-btn">
              Create your Nad Store account
            </Link>
          </div>
        </section>

        {/* Google */}
        <button
          type="button"
          onClick={handleSignInWithGoogle}
          className="google-login-button"
          disabled={isBusy}
        >
          {googleLoading ? (
            <span className="login-spinner" />
          ) : (
            <FaGoogle className="google-icon" />
          )}

          <span>
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>

        {/* Admin */}
        <div className="admin-login-option">
          <div className="admin-login-divider">
            <span>STORE MANAGEMENT</span>
          </div>

          <p>Are you a store administrator?</p>

          <Link to="/admin/login" className="admin-login-button">
            <FaUserShield />
            <span>Admin Login</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="login-copyright">
          © {new Date().getFullYear()} Nad Store. All rights reserved.
        </p>
      </div>
    </main>
  );
}
