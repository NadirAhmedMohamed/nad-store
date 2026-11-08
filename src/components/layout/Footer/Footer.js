import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

import {
  FaStore,
  FaEnvelope,
  FaPhoneAlt,
  FaWhatsapp,
  FaShoppingBag,
  FaClipboardList,
  FaHome,
  FaShieldAlt,
  FaCreditCard,
  FaHeadset,
  FaArrowUp,
  FaHeart,
  FaCheckCircle,
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const email = "nader.a.j12@gmail.com";
  const phone = "+249128813679";
  const whatsapp = "249128813679";

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="nad-footer">
      {/* ================= TOP SECTION ================= */}

      <div className="footer-top">
        <div className="footer-container footer-top-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-icon">
                <FaStore />
              </span>

              <span>
                Nad <strong>Store</strong>
              </span>
            </Link>

            <p className="footer-description">
              Your favorite destination for quality products and a better
              shopping experience. Discover what you love, shop with confidence,
              and enjoy every purchase.
            </p>

            <div className="footer-brand-badge">
              <FaCheckCircle />
              <span>Your Shopping Destination</span>
            </div>
          </div>

          {/* SHOP LINKS */}

          <div className="footer-column">
            <h3 className="footer-heading">Shop</h3>

            <ul className="footer-links">
              <li>
                <Link to="/">
                  <FaHome />
                  <span>Home</span>
                </Link>
              </li>

              <li>
                <Link to="/checkout">
                  <FaShoppingBag />
                  <span>Shopping Basket</span>
                </Link>
              </li>

              <li>
                <Link to="/orders">
                  <FaClipboardList />
                  <span>My Orders</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* CUSTOMER SERVICE */}

          <div className="footer-column">
            <h3 className="footer-heading">Customer Service</h3>

            <ul className="footer-links">
              <li>
                <a href={`mailto:${email}`}>
                  <FaEnvelope />
                  <span>Contact Us</span>
                </a>
              </li>

              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp />
                  <span>WhatsApp Support</span>
                </a>
              </li>

              <li>
                <a href={`tel:${phone}`}>
                  <FaPhoneAlt />
                  <span>Call Us</span>
                </a>
              </li>
            </ul>
          </div>

          {/* CONTACT INFORMATION */}

          <div className="footer-column footer-contact-column">
            <h3 className="footer-heading">Get In Touch</h3>

            <div className="footer-contact-list">
              <a href={`mailto:${email}`} className="footer-contact-item">
                <span className="footer-contact-icon">
                  <FaEnvelope />
                </span>

                <span className="footer-contact-text">
                  <small>Email Address</small>
                  <strong>{email}</strong>
                </span>
              </a>

              <a href={`tel:${phone}`} className="footer-contact-item">
                <span className="footer-contact-icon">
                  <FaPhoneAlt />
                </span>

                <span className="footer-contact-text">
                  <small>Phone Number</small>
                  <strong dir="ltr">{phone}</strong>
                </span>
              </a>

              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-item"
              >
                <span className="footer-contact-icon whatsapp-icon">
                  <FaWhatsapp />
                </span>

                <span className="footer-contact-text">
                  <small>WhatsApp</small>
                  <strong>Chat With Us</strong>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FEATURES STRIP ================= */}

      <div className="footer-features">
        <div className="footer-container footer-features-grid">
          <div className="footer-feature">
            <span className="footer-feature-icon">
              <FaShieldAlt />
            </span>

            <div>
              <h4>Secure Shopping</h4>
              <p>Shop with confidence</p>
            </div>
          </div>

          <div className="footer-feature">
            <span className="footer-feature-icon">
              <FaCreditCard />
            </span>

            <div>
              <h4>Flexible Payments</h4>
              <p>Stripe & Cash on Delivery</p>
            </div>
          </div>

          <div className="footer-feature">
            <span className="footer-feature-icon">
              <FaHeadset />
            </span>

            <div>
              <h4>Customer Support</h4>
              <p>We're here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}

      <div className="footer-bottom">
        <div className="footer-container footer-bottom-content">
          <p className="footer-copyright">
            © {currentYear} <strong>Nad Store</strong>. All rights reserved.
          </p>

          <p className="footer-made-with">
            Made with <FaHeart /> for better shopping.
          </p>

          <button
            type="button"
            className="footer-back-to-top"
            onClick={handleBackToTop}
            aria-label="Back to top"
            title="Back to top"
          >
            <FaArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
