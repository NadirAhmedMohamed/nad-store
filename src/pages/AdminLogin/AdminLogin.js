import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase.config";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaStore,
  FaShieldAlt,
} from "react-icons/fa";

import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getFirebaseError = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/user-not-found":
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password.";

      case "auth/user-disabled":
        return "This account has been disabled.";

      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";

      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";

      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    let authenticated = false;

    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );

      authenticated = true;

      const user = userCredential.user;

      // Step 2: Check administrator permissions
      const adminRef = doc(db, "admins", user.uid);
      const adminSnapshot = await getDoc(adminRef);

      if (!adminSnapshot.exists()) {
        await signOut(auth);
        authenticated = false;

        setError(
          "Access denied. This account does not have administrator permissions.",
        );

        return;
      }

      const adminData = adminSnapshot.data();
      const role = adminData.role;

      // Only admin and demo accounts are allowed
      if (role !== "admin" && role !== "demo") {
        await signOut(auth);
        authenticated = false;

        setError(
          "Access denied. You are not authorized to access the dashboard.",
        );

        return;
      }

      // Step 3: Redirect to dashboard
      navigate("/admin", { replace: true });
    } catch (error) {
      console.error("Admin login error:", error);

      // Sign out if authentication succeeded but permission check failed
      if (authenticated) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("Sign out error:", signOutError);
        }
      }

      setError(
        error.code
          ? getFirebaseError(error.code)
          : "Unable to verify administrator permissions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-container">
        {/* Brand */}
        <div className="admin-login-brand">
          <Link to="/" className="admin-login-logo">
            <span className="admin-login-logo-icon">
              <FaStore />
            </span>

            <span>
              NAD<span>STORE</span>
            </span>
          </Link>

          <div className="admin-login-badge">
            <FaShieldAlt />
            <span>ADMIN PORTAL</span>
          </div>
        </div>

        {/* Login Card */}
        <section className="admin-login-card">
          <div className="admin-login-heading">
            <div className="admin-login-icon">
              <FaShieldAlt />
            </div>

            <h1>Welcome Back</h1>

            <p>Sign in to access your administration dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            {/* Email */}
            <div className="admin-login-field">
              <label htmlFor="admin-email">Email Address</label>

              <div className="admin-login-input-wrapper">
                <FaEnvelope className="admin-login-input-icon" />

                <input
                  id="admin-email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="admin-login-field">
              <label htmlFor="admin-password">Password</label>

              <div className="admin-login-input-wrapper">
                <FaLock className="admin-login-input-icon" />

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="admin-login-error" role="alert">
                <span className="admin-login-error-icon">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-login-spinner"></span>
                  <span>Verifying Access...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Customer Login */}
          <div className="admin-login-customer">
            <p>Not an administrator?</p>

            <Link to="/login">
              Sign in as a customer
              <FaArrowLeft className="admin-login-customer-arrow" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="admin-login-footer">
          <Link to="/" className="admin-login-back">
            <FaArrowLeft />
            <span>Back to Store</span>
          </Link>

          <p>© {new Date().getFullYear()} Nad Store. All rights reserved.</p>

          <span className="admin-login-secure">
            <FaShieldAlt />
            Secure Access
          </span>
        </footer>
      </div>
    </main>
  );
}
