import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

const RequireAuth = ({
  children,
  redirectTo = "/",
  disallowVisitor = false,
}) => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [nextPath, setNextPath] = useState(redirectTo);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setNextPath(redirectTo);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setAllowed(false);
          setNextPath(redirectTo);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const needs2FA = !!userData.twoFactorEnabled;
        const otpVerified = sessionStorage.getItem("otpVerified") === "true";
        const otpPending = sessionStorage.getItem("otpPending") === "true";

        if (needs2FA && (!otpVerified || otpPending)) {
          setAllowed(false);
          setNextPath("/");
          setLoading(false);
          return;
        }

        if (disallowVisitor && userData.role === "visitor") {
          setAllowed(false);
          setNextPath("/");
          setLoading(false);
          return;
        }

        if (!needs2FA) {
          sessionStorage.removeItem("otpPending");
          sessionStorage.setItem("otpVerified", "true");
        }

        setAllowed(true);
        setLoading(false);
      } catch (err) {
        console.error("REQUIRE AUTH ERROR:", err);
        setAllowed(false);
        setNextPath(redirectTo);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [redirectTo, disallowVisitor]);

  if (loading) return <p className="p-6">Loading...</p>;

  return allowed ? (
    children
  ) : (
    <Navigate to={nextPath} state={{ from: location }} replace />
  );
};

export default RequireAuth;