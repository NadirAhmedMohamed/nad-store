import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase.config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiCheckCircle,
  FiGrid,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiAlertTriangle,
  FiLogOut,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminDashboard.css";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const EMPTY_PRODUCT = {
  title: "",
  price: "",
  description: "",
  img: "",
  category: "",
  rate: "0",
  discountPercentage: "0",
  stock: "0",
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const COLORS = {
  pending: "#F59E0B",
  confirmed: "#FF9900",
  shipped: "#64748B",
  delivered: "#16A34A",
  cancelled: "#DC2626",
};

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getDate = (order) => {
  const value = order.createdAt || order.created;

  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const getErrorMessage = (error) => {
  if (error?.code === "permission-denied") {
    return "You do not have permission to perform this action.";
  }

  if (error?.code === "unavailable") {
    return "Unable to connect to the server. Check your internet connection and try again.";
  }

  if (error?.code === "unauthenticated") {
    return "Your session has expired. Please sign in again.";
  }

  return "Something went wrong. Please try again.";
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminRole, setAdminRole] = useState(null);

  const isAdmin = adminRole === "admin";
  const isDemo = adminRole === "demo";

  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [productSaving, setProductSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const navigate = useNavigate();

  const sidebarListRef = useRef(null);

  const [sidebarScroll, setSidebarScroll] = useState({
    visible: false,
    width: 35,
    left: 0,
  });

  useEffect(() => {
    const list = sidebarListRef.current;
    if (!list) return;

    let frameId;

    const updateIndicator = () => {
      cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        const maxScroll = list.scrollWidth - list.clientWidth;
        const isScrollable = maxScroll > 2;

        if (!isScrollable) {
          setSidebarScroll({
            visible: false,
            width: 100,
            left: 0,
          });
          return;
        }

        const width = Math.max(15, (list.clientWidth / list.scrollWidth) * 100);

        const maxLeft = 100 - width;

        const scrollProgress = Math.min(
          1,
          Math.max(0, Math.abs(list.scrollLeft) / maxScroll),
        );

        setSidebarScroll({
          visible: true,
          width,
          left: maxLeft * scrollProgress,
        });
      });
    };

    list.addEventListener("scroll", updateIndicator, {
      passive: true,
    });

    window.addEventListener("resize", updateIndicator);

    const observer = new ResizeObserver(updateIndicator);

    observer.observe(list);
    observer.observe(list.parentElement);

    updateIndicator();

    return () => {
      cancelAnimationFrame(frameId);
      list.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
      observer.disconnect();
    };
  }, []);

  // Verify the signed-in user's admin document.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAdminRole(null);
      setAuthLoading(true);
      setPageError("");

      if (!currentUser) {
        setAuthLoading(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));

        const role = adminSnap.exists() ? adminSnap.data()?.role : null;

        setAdminRole(role === "admin" || role === "demo" ? role : null);

        if (role === "demo") {
          setActiveSection("dashboard");
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        setPageError(getErrorMessage(error));
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadData = useCallback(async () => {
    if (!user || !["admin", "demo"].includes(adminRole)) return;

    setLoading(true);
    setPageError("");

    try {
      // both role can read the public products collection.
      const productsSnap = await getDocs(collection(db, "products"));

      setProducts(
        productsSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })),
      );

      // order's and clients' data are only for the real admin, not demo users.
      if (adminRole === "admin") {
        const [ordersSnap, clientsSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "users")),
        ]);

        setOrders(
          ordersSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );

        setClients(
          clientsSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );
      } else {
        setOrders([]);
        setClients([]);
      }
    } catch (error) {
      console.error("Dashboard loading failed:", error);
      setPageError(getErrorMessage(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user, adminRole]);

  useEffect(() => {
    if (user && (isAdmin || isDemo)) {
      loadData();
    }
  }, [user, isAdmin, isDemo, loadData]);

  // Only paid orders count as sales.
  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) =>
      ["paid", "succeeded"].includes(
        String(order.paymentStatus || "").toLowerCase(),
      ),
    );

    const totalSales = paidOrders.reduce(
      (sum, order) => sum + Number(order.amount || 0),
      0,
    );

    return {
      totalSales,
      totalOrders: orders.length,
      totalCustomers: clients.length,
      avgOrder: paidOrders.length ? totalSales / paidOrders.length : 0,
    };
  }, [orders, clients]);

  const salesData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));

      return date;
    });

    return days.map((date) => {
      const key = date.toLocaleDateString("en-CA");

      const sales = orders
        .filter((order) => {
          const paid = ["paid", "succeeded"].includes(
            String(order.paymentStatus || "").toLowerCase(),
          );

          const orderDate = getDate(order);

          return (
            paid && orderDate && orderDate.toLocaleDateString("en-CA") === key
          );
        })
        .reduce((sum, order) => sum + Number(order.amount || 0), 0);

      return {
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        sales,
      };
    });
  }, [orders]);

  const statusData = useMemo(() => {
    const counts = {};

    orders.forEach((order) => {
      const status = order.status || "pending";
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [orders]);

  const lowStock = useMemo(
    () =>
      products.filter((product) => {
        const stock = Number(product.stock ?? 0);
        return stock < 5;
      }),
    [products],
  );

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders
      .filter((order) => {
        const matchesSearch =
          !term ||
          order.id.toLowerCase().includes(term) ||
          String(order.customerInfo?.name || "")
            .toLowerCase()
            .includes(term) ||
          String(order.customerInfo?.email || "")
            .toLowerCase()
            .includes(term) ||
          String(order.status || "")
            .toLowerCase()
            .includes(term) ||
          String(order.paymentStatus || "")
            .toLowerCase()
            .includes(term);

        const matchesStatus =
          orderStatusFilter === "all" ||
          (order.status || "pending") === orderStatusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) => (getDate(b)?.getTime() || 0) - (getDate(a)?.getTime() || 0),
      );
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    return products.filter((product) =>
      [product.title, product.category, product.description, product.id].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(term),
      ),
    );
  }, [products, productSearch]);

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();

    return clients.filter((client) =>
      [
        client.name,
        client.displayName,
        client.email,
        client.phone,
        client.id,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [clients, clientSearch]);

  const filteredInventory = useMemo(() => {
    const term = inventorySearch.trim().toLowerCase();

    return products.filter((product) =>
      [product.title, product.category, product.id].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [products, inventorySearch]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!STATUSES.includes(newStatus)) {
      toast.warn("Invalid order status.");
      return;
    }

    const previous = orders.find((order) => order.id === orderId);

    if (!previous || previous.status === newStatus) return;

    setBusyKey(`order-${orderId}`);

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );

      toast.success("Order status updated successfully.");
    } catch (error) {
      console.error("Order status update failed:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setBusyKey("");
    }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);

    setProductForm({
      title: product.title || "",
      price: String(product.price ?? ""),
      description: product.description || "",
      img: product.img || "",
      category: product.category || "",
      rate: String(product.rate ?? 0),
      discountPercentage: String(product.discountPercentage ?? 0),
      stock: String(product.stock ?? 0),
    });

    setProductModalOpen(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    const title = productForm.title.trim();
    const category = productForm.category.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const discountPercentage = Number(productForm.discountPercentage);
    const rate = Number(productForm.rate);

    if (!title || !category || !productForm.img.trim()) {
      toast.warn("Enter the product name, category, and image URL.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.warn("Enter a valid price of zero or more.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      toast.warn("Stock must be a non-negative whole number.");
      return;
    }

    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      toast.warn("Discount must be between 0 and 100.");
      return;
    }

    if (!Number.isFinite(rate) || rate < 0 || rate > 5) {
      toast.warn("Rating must be between 0 and 5.");
      return;
    }

    const productData = {
      title,
      category,
      price,
      stock,
      description: productForm.description.trim(),
      img: productForm.img.trim(),
      rate,
      discountPercentage,
    };

    setProductSaving(true);

    try {
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);

        setProducts((current) =>
          current.map((product) =>
            product.id === editingProduct.id
              ? { ...product, ...productData }
              : product,
          ),
        );

        toast.success("Product updated successfully.");
      } else {
        const newProduct = await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });

        setProducts((current) => [
          { id: newProduct.id, ...productData },
          ...current,
        ]);

        toast.success("Product added successfully.");
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      setProductForm(EMPTY_PRODUCT);
    } catch (error) {
      console.error("Product save failed:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setProductSaving(false);
    }
  };

  const askDeleteProduct = (product) => {
    setConfirmAction({
      title: "Delete Product",
      message: `Are you sure you want to permanently delete "${
        product.title || "this product"
      }"? This action cannot be undone.`,
      run: async () => {
        await deleteDoc(doc(db, "products", product.id));

        setProducts((current) =>
          current.filter((item) => item.id !== product.id),
        );

        toast.success("Product deleted successfully.");
      },
    });
  };

  const updateStock = async (product, rawValue) => {
    const stock = Number(rawValue);

    if (!Number.isInteger(stock) || stock < 0) {
      toast.warn("Enter a valid quantity of zero or more.");
      return;
    }

    if (Number(product.stock ?? 0) === stock) return;

    setBusyKey(`stock-${product.id}`);

    try {
      await updateDoc(doc(db, "products", product.id), {
        stock,
      });

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, stock } : item,
        ),
      );

      toast.success("Inventory updated successfully.");
    } catch (error) {
      console.error("Stock update failed:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setBusyKey("");
    }
  };

  const executeConfirmation = async () => {
    if (!confirmAction || confirmBusy) return;

    setConfirmBusy(true);

    try {
      await confirmAction.run();
      setConfirmAction(null);
    } catch (error) {
      console.error("Confirmed action failed:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setConfirmBusy(false);
    }
  };

  const renderOrdersTable = (items) => (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Update Status</th>
          </tr>
        </thead>

        <tbody>
          {items.map((order) => (
            <tr key={order.id}>
              <td>#{order.id.slice(0, 8)}</td>

              <td>
                <strong>{order.customerInfo?.name || "Customer"}</strong>
                <small>{order.customerInfo?.email || ""}</small>
              </td>

              <td>{getDate(order)?.toLocaleDateString("en-US") || "—"}</td>

              <td>{formatMoney(order.amount)}</td>

              <td>{order.paymentStatus || "Not specified"}</td>

              <td>
                <span className={`badge ${order.status || "pending"}`}>
                  {order.status || "pending"}
                </span>
              </td>

              <td>
                <select
                  aria-label="Update order status"
                  value={order.status || "pending"}
                  disabled={busyKey === `order-${order.id}`}
                  onChange={(event) =>
                    updateOrderStatus(order.id, event.target.value)
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {busyKey === `order-${order.id}` && <small>Saving...</small>}
              </td>
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td colSpan="7" className="admin-empty">
                No orders match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderProductsTable = (items) => (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Discount</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {items.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="admin-product-cell">
                  {product.img && (
                    <img
                      src={product.img}
                      alt={product.title || "Product"}
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  )}

                  <div>
                    <strong>{product.title || "Untitled product"}</strong>
                    <small>{product.id.slice(0, 8)}</small>
                  </div>
                </div>
              </td>

              <td>{product.category || "—"}</td>
              <td>{formatMoney(product.price)}</td>

              <td>
                <span
                  className={
                    Number(product.stock ?? 0) < 5
                      ? "stock-warning"
                      : "stock-ok"
                  }
                >
                  {Number(product.stock ?? 0)}
                </span>
              </td>

              <td>{Number(product.discountPercentage ?? 0)}%</td>

              {isAdmin && (
                <td>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      title="Edit product"
                      onClick={() => openEditProduct(product)}
                    >
                      <FiEdit2 />
                    </button>

                    <button
                      type="button"
                      className="admin-icon-btn danger"
                      title="Delete product"
                      onClick={() => askDeleteProduct(product)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="admin-empty">
                No products match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (authLoading) {
    return <div className="admin-state">Verifying access permissions...</div>;
  }

  if (!user) {
    return (
      <div className="admin-state">
        <FiLogOut size={28} />
        <h2>Sign In Required</h2>
        <p>Sign in with an administrator account to access the dashboard.</p>
      </div>
    );
  }

  if (!isAdmin && !isDemo) {
    return (
      <div className="admin-state">
        <FiAlertTriangle size={30} />
        <h2>Access Denied</h2>

        <p>
          This account does not have administrator permissions. If you are the
          administrator, check the document admins/{user.uid} and make sure the
          role value is admin.
        </p>

        {pageError && <p>{pageError}</p>}
      </div>
    );
  }

  const sections = isDemo
    ? [
        { id: "dashboard", label: "Dashboard", icon: <FiGrid /> },
        { id: "products", label: "Products", icon: <FiPackage /> },
        { id: "inventory", label: "Inventory", icon: <FiCheckCircle /> },
      ]
    : [
        { id: "dashboard", label: "Dashboard", icon: <FiGrid /> },
        { id: "orders", label: "Orders", icon: <FiShoppingCart /> },
        { id: "products", label: "Products", icon: <FiPackage /> },
        { id: "clients", label: "Customers", icon: <FiUsers /> },
        { id: "inventory", label: "Inventory", icon: <FiCheckCircle /> },
      ];

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin-login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="admin-layout" dir="ltr">
      <aside className="sidebar">
        <h2>Nad Store</h2>
        <p className="admin-sidebar-subtitle">Admin Panel</p>

        <ul ref={sidebarListRef}>
          {sections.map((section) => (
            <li
              key={section.id}
              className={activeSection === section.id ? "active" : ""}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon}
              <span>{section.label}</span>
            </li>
          ))}
        </ul>

        {sidebarScroll.visible && (
          <div className="admin-sidebar-scroll-indicator" aria-hidden="true">
            <span
              style={{
                width: `${sidebarScroll.width}%`,
                left: `${sidebarScroll.left}%`,
              }}
            />
          </div>
        )}

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          <FiRefreshCw /> Refresh Data
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            <h1>{sections.find((item) => item.id === activeSection)?.label}</h1>
            <p>Manage Nad Store and monitor store activity</p>
          </div>

          <div className="admin-header-actions">
            <div className="admin-user-info">
              <strong>
                {user?.displayName || user?.email || "Administrator"}
              </strong>
              <span>{isDemo ? "Demo Account" : "Administrator"}</span>
            </div>

            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => navigate("/")}
            >
              Back to Store
            </button>

            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleAdminLogout}
            >
              <FiLogOut /> Logout
            </button>

            <button
              type="button"
              className="admin-secondary-btn"
              onClick={loadData}
              disabled={loading}
            >
              <FiRefreshCw />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {pageError && (
          <div className="admin-error-banner">
            <FiAlertTriangle />
            <span>{pageError}</span>

            <button type="button" onClick={loadData}>
              Try Again
            </button>
          </div>
        )}

        {loading && <div className="admin-loading">Loading store data...</div>}

        {!loading && activeSection === "dashboard" && (
          <>
            {/* Demo dashboard: read-only */}
            {isDemo && (
              <section className="card">
                <h2>Demo Dashboard</h2>
                <p>
                  Read-only preview of Nad Store. Editing and deletion are
                  disabled.
                </p>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span>
                      <FiPackage />
                    </span>
                    <div>
                      <h3>{products.length}</h3>
                      <p>Products</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span>
                      <FiCheckCircle />
                    </span>
                    <div>
                      <h3>{lowStock.length}</h3>
                      <p>Low-stock products</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setActiveSection("products")}
                >
                  View Products
                </button>
              </section>
            )}

            {/* Full dashboard: real admin only */}
            {isAdmin && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span>
                      <FiDollarSign />
                    </span>
                    <div>
                      <h3>{formatMoney(stats.totalSales)}</h3>
                      <p>Paid Sales</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span>
                      <FiShoppingCart />
                    </span>
                    <div>
                      <h3>{stats.totalOrders}</h3>
                      <p>Total Orders</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span>
                      <FiUsers />
                    </span>
                    <div>
                      <h3>{stats.totalCustomers}</h3>
                      <p>Registered Customers</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <span>
                      <FiPackage />
                    </span>
                    <div>
                      <h3>{formatMoney(stats.avgOrder)}</h3>
                      <p>Average Paid Order</p>
                    </div>
                  </div>
                </div>

                <div className="charts-row admin-dashboard-charts">
                  <div className="card">
                    <h4>Paid Sales - Last 7 Days</h4>

                    <div className="admin-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />

                          <Tooltip formatter={(value) => formatMoney(value)} />

                          <Line
                            type="monotone"
                            dataKey="sales"
                            name="Sales"
                            stroke="#FF9900"
                            strokeWidth={3}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <h4>Orders by Status</h4>

                    <div className="admin-chart">
                      {statusData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              label
                            >
                              {statusData.map((entry, index) => (
                                <Cell
                                  key={`${entry.name}-${index}`}
                                  fill={COLORS[entry.name] || "#64748B"}
                                />
                              ))}
                            </Pie>

                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="admin-empty">No orders to display.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="charts-row admin-dashboard-bottom">
                  <div className="card">
                    <div className="admin-card-heading">
                      <h4>Recent Orders</h4>

                      <button
                        type="button"
                        className="admin-text-btn"
                        onClick={() => setActiveSection("orders")}
                      >
                        View All Orders
                      </button>
                    </div>

                    {renderOrdersTable(
                      [...orders]
                        .sort(
                          (a, b) =>
                            (getDate(b)?.getTime() || 0) -
                            (getDate(a)?.getTime() || 0),
                        )
                        .slice(0, 5),
                    )}
                  </div>

                  <div className="card">
                    <div className="admin-card-heading">
                      <h4>Low Stock Alerts</h4>
                      <FiAlertTriangle />
                    </div>

                    {lowStock.length === 0 ? (
                      <p className="admin-success-message">
                        All products are sufficiently stocked <FiCheckCircle />
                      </p>
                    ) : (
                      lowStock.slice(0, 8).map((product) => (
                        <div className="low-stock-item" key={product.id}>
                          <span>{product.title || "Untitled product"}</span>

                          <strong className="stock-warning">
                            {Number(product.stock ?? 0) === 0
                              ? "Out of Stock"
                              : `Remaining: ${product.stock}`}
                          </strong>
                        </div>
                      ))
                    )}

                    <button
                      type="button"
                      className="admin-text-btn"
                      onClick={() => setActiveSection("inventory")}
                    >
                      Manage Inventory
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {!loading && isAdmin && activeSection === "orders" && (
          <section className="card">
            <div className="admin-toolbar">
              <input
                className="search"
                placeholder="Search by order ID, customer name, or email..."
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
              />

              <select
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value)}
              >
                <option value="all">All Statuses</option>

                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {renderOrdersTable(filteredOrders)}
          </section>
        )}

        {!loading && activeSection === "products" && (
          <section className="card">
            <div className="admin-toolbar">
              <input
                className="search"
                placeholder="Search by product name or category..."
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />

              {isAdmin && (
                <button
                  type="button"
                  className="admin-primary-btn"
                  onClick={openNewProduct}
                >
                  <FiPlus /> Add Product
                </button>
              )}
            </div>

            {renderProductsTable(filteredProducts)}
          </section>
        )}

        {!loading && isAdmin && activeSection === "clients" && (
          <section className="card">
            <div className="admin-toolbar">
              <input
                className="search"
                placeholder="Search by name, email, or customer ID..."
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
              />

              <span className="admin-result-count">
                Customers: {filteredClients.length}
              </span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Customer ID</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td>{client.name || client.displayName || "—"}</td>
                      <td>{client.email || "—"}</td>
                      <td>{client.phone || "—"}</td>
                      <td>{client.id}</td>
                    </tr>
                  ))}

                  {!filteredClients.length && (
                    <tr>
                      <td colSpan="4" className="admin-empty">
                        No customers match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && activeSection === "inventory" && (
          <section className="card">
            <div className="admin-toolbar">
              <input
                className="search"
                placeholder="Search inventory by product name..."
                value={inventorySearch}
                onChange={(event) => setInventorySearch(event.target.value)}
              />

              <span className="admin-result-count">
                Low-stock products: {lowStock.length}
              </span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Current Quantity</th>
                    <th>New Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInventory.map((product) => (
                    <tr key={product.id}>
                      <td>{product.title || "Untitled product"}</td>
                      <td>{product.category || "—"}</td>
                      <td>{Number(product.stock ?? 0)}</td>

                      <td>
                        {isAdmin ? (
                          <form
                            className="admin-stock-form"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const input = event.currentTarget.elements.stock;
                              updateStock(product, input.value);
                            }}
                          >
                            <input
                              name="stock"
                              type="number"
                              min="0"
                              step="1"
                              defaultValue={Number(product.stock ?? 0)}
                              aria-label={`Quantity for ${product.title || "Product"}`}
                            />
                            <button type="submit">Save</button>
                          </form>
                        ) : (
                          <span>{Number(product.stock ?? 0)}</span>
                        )}
                      </td>

                      <td>
                        {Number(product.stock ?? 0) === 0 ? (
                          <span className="stock-warning">Out of Stock</span>
                        ) : Number(product.stock ?? 0) < 5 ? (
                          <span className="stock-warning">Low Stock</span>
                        ) : (
                          <span className="stock-ok">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!filteredInventory.length && (
                    <tr>
                      <td colSpan="5" className="admin-empty">
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {isAdmin && productModalOpen && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !productSaving) {
              setProductModalOpen(false);
            }
          }}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <h2 id="product-modal-title">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={saveProduct}>
              <label>
                Product Name *
                <input
                  value={productForm.title}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="admin-form-grid">
                <label>
                  Price *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        price: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Category *
                  <input
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        category: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Stock *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        stock: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Discount (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={productForm.discountPercentage}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        discountPercentage: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Rating (0 - 5)
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={productForm.rate}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        rate: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Product Image URL *
                <input
                  type="url"
                  value={productForm.img}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      img: event.target.value,
                    })
                  }
                  placeholder="https://..."
                  required
                />
              </label>

              {productForm.img && (
                <img
                  className="admin-product-preview"
                  src={productForm.img}
                  alt="Product preview"
                  onError={() => toast.warn("Unable to load image preview.")}
                />
              )}

              <label>
                Description
                <textarea
                  rows="4"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  disabled={productSaving}
                  onClick={() => setProductModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-btn"
                  disabled={productSaving}
                >
                  {productSaving
                    ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isAdmin && confirmAction && (
        <div className="admin-modal-overlay">
          <section
            className="admin-modal admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <FiAlertTriangle className="admin-confirm-icon" size={34} />

            <h2 id="confirm-title">{confirmAction.title}</h2>
            <p>{confirmAction.message}</p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-btn"
                disabled={confirmBusy}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-danger-btn"
                disabled={confirmBusy}
                onClick={executeConfirmation}
              >
                {confirmBusy ? "Processing..." : "Confirm Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
