import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const PrivateRoute = ({ children, redirectTo = "/" }) => {
  const [user, loading] = useAuthState(auth);
  const [hasAccess, setHasAccess] = useState(null);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setError("");

      if (loading) return;

      if (!user) {
        if (alive) setHasAccess(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!alive) return;

        if (!snap.exists()) {
          setHasAccess(false);
          setError("No user profile found in Firestore.");
          return;
        }

        const data = snap.data();
        const role = String(data?.role || "").toLowerCase();

        setHasAccess(role === "admin" || role === "staff");
      } catch (e) {
        console.error("Admin/staff check failed:", e);
        if (!alive) return;
        setHasAccess(false);
        setError("Failed to verify access. Please try again.");
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [user, loading]);

  if (loading || hasAccess === null) {
    return <p className="p-6">Loading...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600 font-semibold">{error}</p>;
  }

  return user && hasAccess ? (
    children
  ) : (
    <Navigate to={redirectTo} state={{ from: location }} replace />
  );
};

export default PrivateRoute;