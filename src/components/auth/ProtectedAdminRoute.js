
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase.config";

export default function ProtectedAdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setStatus("guest");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "admins", user.uid));

        if (!active) return;

        if (!snap.exists()) {
          setStatus("forbidden");
          return;
        }

        const role = snap.data().role;

        if (role === "admin" || role === "demo") {
          setStatus(role);
        } else {
          setStatus("forbidden");
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        if (active) setStatus("error");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return <p>Checking admin permissions...</p>;
  }

  if (status === "guest") {
    return <Navigate to="/admin-login" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/" replace />;
  }

  if (status === "error") {
    return <p>Could not verify admin permissions. Please try again.</p>;
  }

  return React.cloneElement(children, { adminRole: status });
}
