
import React, { useState } from "react";
import "./Register.css";

import { auth, db } from "../../firebase.config.js";
import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { Link, useNavigate } from "react-router-dom";
import {
  FaStore,
  FaArrowLeft,
  FaGoogle,
} from "react-icons/fa";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleGoogleRegister = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("GOOGLE_EMAIL_MISSING");
      }

      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      // إنشاء مستند Firestore للمستخدم الجديد فقط.
      // لا نغيّر السلة أو البيانات الموجودة للمستخدم القديم.
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || "",
          basket: [],
          createdAt: serverTimestamp(),
        });
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error(
        "Google registration error:",
        err.code,
        err.message
      );

      if (err.code === "auth/popup-closed-by-user") {
        setError("You closed the Google sign-in window.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Your browser blocked the popup. Please allow popups and try again.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase Authentication.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email using another sign-in method. Please sign in first.");
      } else if (err.message === "GOOGLE_EMAIL_MISSING") {
        setError("Google did not provide an email address. Please try another account.");
      } else {
        setError("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page" dir="ltr">
      <Link to="/" className="register-brand">
        <span className="register-brand-icon">
          <FaStore />
        </span>

        <span className="register-brand-name">
          Nad <strong>Store</strong>
        </span>
      </Link>

      <section className="register-card">
        <div className="register-heading">
          <h1>Create your account</h1>
          <p>
            Join Nad Store securely using your Google account.
          </p>
        </div>

        <div className="register-google-info">
          <FaGoogle className="register-google-info-icon" />
          <div>
            <strong>Quick and secure registration</strong>
            <p>
              Use your Google account to continue. Your email
              and profile name will be saved to your Nad Store account.
            </p>
          </div>
        </div>

        {error && (
          <div className="register-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="register-google-btn"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <FaGoogle />
          <span>
            {loading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </span>
        </button>

        <div className="register-divider">
          <span>Secure sign-in</span>
        </div>

        <p className="register-signin-text">
          Already have an account?
        </p>

        <Link to="/login" className="register-signin-link">
          <FaArrowLeft />
          <span>Back to Sign In</span>
        </Link>

        <p className="register-terms">
          By continuing, you agree to Nad Store's Conditions
          of Use and Privacy Notice.
        </p>
      </section>

      <p className="register-footer">
        © {new Date().getFullYear()} Nad Store. All rights reserved.
      </p>
    </main>
  );
}
