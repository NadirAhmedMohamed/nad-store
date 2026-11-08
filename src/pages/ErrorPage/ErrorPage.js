import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ErrorPage.css";

import {
  FaHome,
  FaArrowLeft,
  FaShoppingBag,
  FaSearch,
  FaCompass,
  FaExclamationCircle,
} from "react-icons/fa";

const ErrorPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <main className="error-page">
      <div className="error-background-shape error-shape-one" />
      <div className="error-background-shape error-shape-two" />

      <div className="error-container">
        {/* BRAND */}
        <Link to="/" className="error-brand">
          <span className="error-brand-icon">
            <FaShoppingBag />
          </span>

          <span className="error-brand-name">
            Nad <strong>Store</strong>
          </span>
        </Link>

        {/* MAIN CONTENT */}
        <section className="error-content">
          {/* ILLUSTRATION */}
          <div className="error-visual">
            <div className="error-visual-glow" />

            <div className="error-visual-circle">
              <div className="error-number">404</div>

              <div className="error-bag">
                <FaShoppingBag />
              </div>

              <span className="error-floating-icon floating-one">
                <FaSearch />
              </span>

              <span className="error-floating-icon floating-two">
                <FaCompass />
              </span>

              <span className="error-floating-icon floating-three">
                <FaExclamationCircle />
              </span>

              <span className="error-dot dot-one" />
              <span className="error-dot dot-two" />
              <span className="error-dot dot-three" />
            </div>

            <div className="error-visual-caption">
              <span className="error-caption-line" />
              <span>LOST IN THE SHOPPING WORLD?</span>
              <span className="error-caption-line" />
            </div>
          </div>

          {/* TEXT */}
          <div className="error-message">
            <span className="error-label">
              <span className="error-label-dot" />
              ERROR 404 — PAGE NOT FOUND
            </span>

            <h1>
              Oops! This page
              <br />
              <span>went out of stock.</span>
            </h1>

            <p className="error-description">
              Looks like the page you're searching for isn't available. It may
              have been moved, removed, or the link might be incorrect. Don't
              worry — there's plenty more to discover at Nad Store.
            </p>

            {/* ACTIONS */}
            <div className="error-actions">
              <Link to="/" className="error-home-button">
                <FaHome />
                <span>Back to Home</span>
              </Link>

              <button
                type="button"
                className="error-back-button"
                onClick={handleGoBack}
              >
                <FaArrowLeft />
                <span>Go Back</span>
              </button>
            </div>

            {/* HELP */}
            <div className="error-help">
              <div className="error-help-icon">
                <FaShoppingBag />
              </div>

              <div className="error-help-text">
                <strong>Ready to keep shopping?</strong>
                <span>
                  Return to Nad Store and discover something you love.
                </span>
              </div>

              <Link
                to="/"
                className="error-help-link"
                aria-label="Explore Nad Store"
              >
                <FaArrowLeft />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="error-bottom">
          <span>
            © {new Date().getFullYear()} <strong>Nad Store</strong>
          </span>

          <span className="error-bottom-divider" />

          <span>Making shopping better, every day.</span>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;
