import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import LoginRegisterForm from "./LoginForm.jsx";
import VerifyOTPModal from "./VerifyOTPModal.jsx";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  LayoutDashboard,
  House,
  Users,
  Info,
  MonitorPlay,
  ShoppingCart,
  PhoneCall,
  LogIn,
  Briefcase,
  Trophy,
  FolderKanban,
} from "lucide-react";

import UPLogo from "../assets/UP.png";
import UPDrrm from "../assets/updrrm.png";
import UPNAME from "../assets/dname-yw-v2.png";

function Header() {
  const [showLogin, setShowLogin] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpUser, setOtpUser] = useState(null);

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [redirectPath, setRedirectPath] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [authTransitioning, setAuthTransitioning] = useState(false);

  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  const otpPending = sessionStorage.getItem("otpPending") === "true";
  const otpVerified = sessionStorage.getItem("otpVerified") === "true";
  const fullyAuthenticated =
    !!user && (!otpPending || otpVerified) && !authTransitioning;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const role = String(userSnap.data().role || "").toLowerCase();
            setUserRole(role);
            setIsAdmin(role === "admin");
            setIsStaff(role === "staff");
          } else {
            setUserRole("");
            setIsAdmin(false);
            setIsStaff(false);
          }
        } catch (err) {
          console.error("HEADER AUTH ERROR:", err);
          setUserRole("");
          setIsAdmin(false);
          setIsStaff(false);
        }
      } else {
        setUserRole("");
        setIsAdmin(false);
        setIsStaff(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleRequireLogin = (event) => {
      const path = event?.detail?.path || "/";
      setRedirectPath(path);
      setMenuOpen(false);
      setProfileMenuOpen(false);
      setShowLogin(true);

      window.dispatchEvent(new CustomEvent("login-requested"));
    };

    window.addEventListener("require-login", handleRequireLogin);

    return () => {
      window.removeEventListener("require-login", handleRequireLogin);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearOtpSessionFlags = () => {
    sessionStorage.removeItem("otpPending");
    sessionStorage.removeItem("otpVerified");
    sessionStorage.removeItem("postOtpRedirect");
  };

  const showPopup = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 1500);
  };

  const requireLoginForPath = (path, e) => {
    if (!fullyAuthenticated) {
      e?.preventDefault?.();
      setRedirectPath(path);
      setMenuOpen(false);
      setProfileMenuOpen(false);
      setShowLogin(true);
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearOtpSessionFlags();
      setShowOtpModal(false);
      setOtpUser(null);
      setAuthTransitioning(false);
      setUser(null);
      setUserRole("");
      setIsAdmin(false);
      setIsStaff(false);
      setRedirectPath(null);
      setProfileMenuOpen(false);
      showPopup("Log Out Successfully!");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleOtpRequired = (payload) => {
    setAuthTransitioning(false);
    setOtpUser(payload);
    setShowLogin(false);
    setShowOtpModal(true);
  };

  const handleOtpVerified = async () => {
    setAuthTransitioning(false);
    setShowOtpModal(false);
    setOtpUser(null);

    let nextPath = redirectPath || "/";

    try {
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const role = String(userSnap.data().role || "").toLowerCase();
          setUserRole(role);
          setIsAdmin(role === "admin");
          setIsStaff(role === "staff");

          if (
            role === "visitor" &&
            (nextPath === "/user-panel" || nextPath === "/edit-profile")
          ) {
            nextPath = "/";
          }
        }
      }
    } catch (err) {
      console.error("POST OTP ROLE CHECK ERROR:", err);
      nextPath = "/";
    }

    setRedirectPath(null);
    navigate(nextPath, { replace: true });
  };

  const handleOtpCancel = () => {
    setAuthTransitioning(false);
    setShowOtpModal(false);
    setOtpUser(null);
    setUser(null);
    setUserRole("");
    setIsAdmin(false);
    setIsStaff(false);
    setRedirectPath(null);
    setProfileMenuOpen(false);
  };

  // ONLY "Trainings" stays protected
  const desktopMainNav = [
    { label: "Home", to: "/", icon: House, type: "public-link" },
    { label: "About Us", to: "/about-us", icon: Users, type: "public-link" },
    { label: "Trainings", to: "/#trainings", icon: Info, type: "protected-hash" },
    {
      label: "Achievements",
      to: "/achievements",
      icon: Trophy,
      type: "public-link",
    },
    {
      label: "Projects",
      to: "/projects",
      icon: FolderKanban,
      type: "public-link",
    },
  ];

  const mobileNav = [
    { label: "Home", to: "/", icon: House, type: "public-link" },
    { label: "About Us", to: "/about-us", icon: Users, type: "public-link" },
    { label: "Trainings", to: "/#trainings", icon: Info, type: "protected-hash" },
    {
      label: "E-Learning",
      to: "/e-learning",
      icon: MonitorPlay,
      type: "public-link",
    },
    {
      label: "Achievements",
      to: "/achievements",
      icon: Trophy,
      type: "public-link",
    },
    {
      label: "Projects",
      to: "/projects",
      icon: FolderKanban,
      type: "public-link",
    },
    { label: "Contact", to: "/#contact", icon: PhoneCall, type: "public-hash" },
    {
      label: "Careers",
      to: "/careers",
      icon: Briefcase,
      type: "public-link",
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[#7b1113] shadow-md">
        <div className="mx-auto w-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-[76px]">
            <div className="flex items-center min-w-0 shrink-0">
              <Link
                to="/"
                className="flex items-center gap-2 md:gap-3 min-w-0"
              >
                <img src={UPLogo} alt="UP Logo" className="h-9 w-auto shrink-0" />
                <img
                  src={UPDrrm}
                  alt="UP DRRM"
                  className="h-9 w-auto shrink-0"
                />
                <div className="hidden md:block h-9 border-l border-white/60 mx-1" />
                <img
                  src={UPNAME}
                  alt="UP Name"
                  className="hidden md:block h-9 w-auto max-w-[210px] object-contain"
                />
              </Link>
            </div>

            <nav className="hidden xl:flex flex-1 justify-center px-6">
              <ul className="flex items-center gap-3 text-white">
                {desktopMainNav.map((item) => {
                  const Icon = item.icon;

                  if (item.type === "protected-hash") {
                    return (
                      <li key={item.label}>
                        <HashLink
                          smooth
                          to={fullyAuthenticated ? item.to : "#"}
                          onClick={(e) => requireLoginForPath(item.to, e)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-[15px] hover:bg-white/10 hover:text-[#F3AA2C] transition"
                        >
                          <Icon size={18} strokeWidth={2.2} />
                          <span>{item.label}</span>
                        </HashLink>
                      </li>
                    );
                  }

                  if (item.type === "public-hash") {
                    return (
                      <li key={item.label}>
                        <HashLink
                          smooth
                          to={item.to}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-[15px] hover:bg-white/10 hover:text-[#F3AA2C] transition"
                        >
                          <Icon size={18} strokeWidth={2.2} />
                          <span>{item.label}</span>
                        </HashLink>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-[15px] hover:bg-white/10 hover:text-yellow-300 transition"
                      >
                        <Icon size={18} strokeWidth={2.2} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div
              className="hidden xl:flex items-center gap-4 shrink-0"
              ref={profileMenuRef}
            >
              <div className="flex items-center gap-3 text-white">
                <Link
                  to="/e-learning"
                  className="px-2 py-1.5 text-sm font-medium hover:text-yellow-300 transition"
                >
                  E-Learning
                </Link>

                <HashLink
                  smooth
                  to="/#contact"
                  className="px-2 py-1.5 text-sm font-medium hover:text-yellow-300 transition"
                >
                  Contact
                </HashLink>

                <Link
                  to="/careers"
                  className="px-2 py-1.5 text-sm font-medium hover:text-yellow-300 transition"
                >
                  Careers
                </Link>
              </div>

              <div className="h-7 w-px bg-white/20" />

              {fullyAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex items-center text-white font-semibold text-sm transition"
                  >
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-base text-white font-bold">
                      {user.email?.slice(0, 2).toUpperCase()}
                    </div>
                    <ChevronDown size={18} className="ml-2" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[60]">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.displayName || user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/shop"
                          onClick={() => setProfileMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ShoppingCart size={18} />
                          Shop
                        </Link>

                        {(isAdmin || isStaff) && (
                          <Link
                            to="/admin/manual-post"
                            onClick={() => setProfileMenuOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Shield size={18} />
                            Admin Panel
                          </Link>
                        )}

                        {fullyAuthenticated &&
                          !isAdmin &&
                          !isStaff &&
                          userRole !== "visitor" && (
                            <Link
                              to="/user-panel"
                              onClick={() => setProfileMenuOpen(false)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <LayoutDashboard size={18} />
                              Dashboard
                            </Link>
                          )}

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#7b1113] hover:bg-[#3b0000]"
                        >
                          <LogOut size={18} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRedirectPath("/");
                    setShowLogin(true);
                  }}
                  className="bg-[#F3AA2C] border border-transparent hover:bg-transparent hover:border-white text-white font-semibold text-sm px-4 py-2 transition rounded-full flex items-center gap-2"
                >
                  <span>Log In</span>
                  <LogIn size={20} />
                </button>
              )}
            </div>

            <button
              className="xl:hidden text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="xl:hidden fixed top-[76px] right-0 w-72 h-[calc(100vh-76px)] bg-[#7b1113] text-white p-5 z-50 shadow-lg overflow-y-auto">
          <ul className="flex flex-col gap-4 mt-2">
            {mobileNav.map((item) => {
              const Icon = item.icon;

              if (item.type === "protected-hash") {
                return (
                  <li key={item.label}>
                    <HashLink
                      smooth
                      to={fullyAuthenticated ? item.to : "#"}
                      onClick={(e) => {
                        const blocked = requireLoginForPath(item.to, e);
                        if (!blocked) setMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
                    >
                      <Icon size={22} />
                      <span>{item.label}</span>
                    </HashLink>
                  </li>
                );
              }

              if (item.type === "public-hash") {
                return (
                  <li key={item.label}>
                    <HashLink
                      smooth
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
                    >
                      <Icon size={22} />
                      <span>{item.label}</span>
                    </HashLink>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
                  >
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}

            <li>
              <Link
                to="/shop"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
              >
                <ShoppingCart size={22} />
                <span>Shop</span>
              </Link>
            </li>

            {fullyAuthenticated && (isAdmin || isStaff) && (
              <li>
                <Link
                  to="/admin/manual-post"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
                >
                  <Shield size={22} />
                  <span>Admin Panel</span>
                </Link>
              </li>
            )}

            {fullyAuthenticated && !isAdmin && !isStaff && userRole !== "visitor" && (
              <li>
                <Link
                  to="/user-panel"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
                >
                  <LayoutDashboard size={22} />
                  <span>Dashboard</span>
                </Link>
              </li>
            )}

            {fullyAuthenticated && (
              <li>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 hover:text-yellow-300 transition"
                >
                  <LogOut size={22} />
                  <span>Log Out</span>
                </button>
              </li>
            )}
          </ul>

          {!fullyAuthenticated && (
            <div className="mt-8">
              <button
                onClick={() => {
                  setShowLogin(true);
                  setMenuOpen(false);
                }}
                className="w-full bg-yellow-500 border border-transparent hover:bg-transparent hover:border-white text-white font-semibold text-sm px-4 py-3 transition rounded-full flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Log In
              </button>
            </div>
          )}
        </div>
      )}

      {showLogin && (
        <LoginRegisterForm
          closeForm={() => setShowLogin(false)}
          setUser={setUser}
          onOtpRequired={handleOtpRequired}
          setAuthTransitioning={setAuthTransitioning}
        />
      )}

      {showOtpModal && (
        <VerifyOTPModal
          otpUser={otpUser}
          onClose={() => {
            setShowOtpModal(false);
            setOtpUser(null);
          }}
          onVerified={handleOtpVerified}
          onCancel={handleOtpCancel}
        />
      )}

      {message && (
        <div className="fixed inset-0 flex justify-center items-center z-50">
          <div className="bg-black/60 text-white text-xl font-bold px-6 py-4 rounded-lg shadow-lg text-center">
            {message}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;