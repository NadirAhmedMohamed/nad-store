import React, { useState, useEffect } from "react";
import "./Header.css";

import { useAuth } from "../../../contexts/GlobalState.js";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../../firebase.config.js";

import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
} from "firebase/firestore";

import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaClipboardList,
  FaSignInAlt,
  FaSignOutAlt,
  FaBoxOpen,
  FaTimes,
} from "react-icons/fa";

import { FiGrid, FiMenu, FiX } from "react-icons/fi";

export default function Header({ searchTerm = "", setSearchTerm }) {
  const { user, basket } = useAuth();
  const navigate = useNavigate();

  const [showDashboard, setShowDashboard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const basketCount = basket?.length || 0;

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Guest";

  // Check whether the current user may see the dashboard link.
  useEffect(() => {
    let cancelled = false;

    const checkDashboardAccess = async () => {
      setShowDashboard(false);

      if (!user?.uid) return;

      try {
        const adminSnap = await getDoc(doc(db, "admins", user.uid));

        if (cancelled) return;

        const role = adminSnap.exists() ? adminSnap.data().role : null;

        setShowDashboard(role === "admin" || role === "demo");
      } catch (error) {
        console.error("Dashboard access check failed:", error);

        if (!cancelled) setShowDashboard(false);
      }
    };

    checkDashboardAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Live product search suggestions.
  useEffect(() => {
    const search = (searchTerm || "").trim().toLowerCase();

    if (!search) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);

      try {
        const productsQuery = query(
          collection(db, "products"),
          orderBy("titleLower"),
          startAt(search),
          endAt(search + "\uf8ff"),
          limit(6),
        );

        const snapshot = await getDocs(productsQuery);

        if (!cancelled) {
          setSuggestions(
            snapshot.docs.map((document) => ({
              id: document.id,
              ...document.data(),
            })),
          );
        }
      } catch (error) {
        console.error("Search suggestions error:", error);

        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const closeMenu = () => setMenuOpen(false);

  // Sign out with a global Nad Store toast notification.
  const handleSignOut = async () => {
    try {
      closeMenu();

      await signOut(auth);

      toast.success("You have signed out successfully.", {
        toastId: "sign-out-success",
      });

      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);

      toast.error("Unable to sign out. Please try again.", {
        toastId: "sign-out-error",
      });
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const search = (searchTerm || "").trim();

    setShowSuggestions(false);
    closeMenu();

    if (!search) {
      navigate("/");
      return;
    }

    navigate(`/?q=${encodeURIComponent(search)}`);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    navigate("/", { replace: true });
  };

  const handleSuggestionClick = () => {
    setShowSuggestions(false);
    setSearchTerm("");
    setSuggestions([]);
    closeMenu();
  };

  return (
    <header className="header-container">
      {/* Logo */}
      <Link to="/" className="header-logo" onClick={closeMenu}>
        <span className="logo-nad">Nad</span>
        <span className="logo-store">Store</span>
      </Link>

      {/* Search */}
      <div className="header-search-wrapper">
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            autoComplete="off"
            value={searchTerm}
            onFocus={() => setShowSuggestions(true)}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
          />

          {searchTerm.trim() && (
            <button
              type="button"
              className="search-clear-icon"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}

          <button type="submit" className="search-icon" aria-label="Search">
            <FaSearch />
          </button>
        </form>

        {/* Live suggestions */}
        {showSuggestions && searchTerm.trim() && (
          <div className="search-suggestions">
            {suggestions.length > 0 ? (
              <>
                <div className="suggestions-heading">
                  <FaSearch />
                  <span>Search suggestions</span>
                </div>

                {suggestions.map((product) => (
                  <Link
                    to={`/product/${product.id}`}
                    className="suggestion-item"
                    key={product.id}
                    onClick={handleSuggestionClick}
                  >
                    <div className="suggestion-image">
                      {product.image || product.img ? (
                        <img
                          src={product.image || product.img}
                          alt={product.title || "Product"}
                        />
                      ) : (
                        <FaBoxOpen />
                      )}
                    </div>

                    <div className="suggestion-info">
                      <span className="suggestion-title">{product.title}</span>

                      {product.category && (
                        <span className="suggestion-category">
                          {product.category}
                        </span>
                      )}

                      <span className="suggestion-price">
                        ${Number(product.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}

                <button
                  type="button"
                  className="view-all-results"
                  onClick={handleSearchSubmit}
                >
                  View all matching products
                </button>
              </>
            ) : suggestionsLoading ? (
              <div className="no-search-results">Searching products...</div>
            ) : (
              <div className="no-search-results">
                <FaBoxOpen />
                <span>No products found for "{searchTerm}"</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shopping cart */}
      <Link
        to="/checkout"
        className="header-basket"
        aria-label={`Shopping basket, ${basketCount} items`}
        onClick={closeMenu}
      >
        <span className="basket-icon-wrapper">
          <FaShoppingCart className="basket-icon" />

          <span className="basket-count">
            {basketCount > 99 ? "99+" : basketCount}
          </span>
        </span>

        <span className="basket-info">
          <span className="basket-eyebrow">Your</span>
          <span className="basket-label">Basket</span>
        </span>
      </Link>

      {/* Mobile menu button */}
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="header-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Navigation */}
      <nav
        id="header-navigation"
        className={`header-nav ${menuOpen ? "menu-open" : ""}`}
      >
        {/* Account */}
        <div className="account-container nav-two-line">
          <span className="nav-eyebrow">
            <FaUser />
            <span>Hello, {displayName}</span>
          </span>

          {user ? (
            <button
              type="button"
              className="header-action nav-main-label"
              onClick={handleSignOut}
            >
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="header-action nav-main-label"
              onClick={closeMenu}
            >
              <FaSignInAlt />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Admin dashboard */}
        {showDashboard && (
          <Link
            to="/admin"
            className="header-nav-item nav-two-line admin-dashboard-link"
            onClick={closeMenu}
          >
            <span className="nav-eyebrow">
              <FiGrid />
              <span>Admin Area</span>
            </span>

            <span className="nav-main-label">Dashboard</span>
          </Link>
        )}

        {/* Orders */}
        <Link
          to="/orders"
          className="header-nav-item nav-two-line nav-menu-link"
          onClick={closeMenu}
        >
          <span className="nav-eyebrow">
            <FaClipboardList />
            <span>Your</span>
          </span>

          <span className="nav-main-label">Orders</span>
        </Link>

        {/* Prime */}
        <div className="prime-container nav-two-line">
          <span className="nav-eyebrow">Your</span>
          <span className="nav-main-label">Nad Prime</span>
        </div>
      </nav>

      {/* Close menu when clicking outside */}
      {menuOpen && (
        <button
          type="button"
          className="menu-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}
    </header>
  );
}
