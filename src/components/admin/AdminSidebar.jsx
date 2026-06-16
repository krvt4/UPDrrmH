import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import UPLogo from "../../assets/UP.png";
import UPDrrm from "../../assets/updrrm.png";
import UPNAME from "../../assets/dname-yw-v2.png";
import {
  BookOpenText,
  Globe,
  LogOutIcon,
  Newspaper,
  PackageOpenIcon,
  MessageSquareQuote,
  Mail,
  Inbox,
  Briefcase,
} from "lucide-react";

const AdminSidebar = ({ adminName, menuOpen, setMenuOpen }) => {
  const sidebarClasses = `
    bg-red-900 text-white flex flex-col p-4 transition-transform duration-300 z-50
    fixed md:static
    top-18 md:top-0 left-0
    h-screen
    w-4/5 md:w-1/5
    overflow-y-auto
    ${menuOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `;

  const navigate = useNavigate();
  const [manualCount, setManualCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  useEffect(() => {
    const fetchManuals = async () => {
      try {
        const manualsRef = collection(db, "manuals");
        const manualSnapshot = await getDocs(manualsRef);
        setManualCount(manualSnapshot.size);
      } catch (error) {
        console.error("Error fetching manuals:", error);
      }
    };

    const fetchPendingOrders = async () => {
      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("status", "==", "pending"));
        const orderSnapshot = await getDocs(q);
        setPendingOrdersCount(orderSnapshot.size);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    const fetchPendingUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("status", "==", "pending"));
        const snap = await getDocs(q);
        setPendingUsersCount(snap.size);
      } catch (error) {
        console.error("Error fetching pending users:", error);
      }
    };

    fetchManuals();
    fetchPendingOrders();
    fetchPendingUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <div className={sidebarClasses}>
        {/* Logos */}
        <div className="hidden lg:flex flex-wrap items-center justify-center mb-6 max-w-full">
          <div className="flex gap-4 mb-4">
            <img
              src={UPLogo}
              alt="UP Logo"
              className="h-12 max-w-full object-contain"
            />
            <img
              src={UPDrrm}
              alt="UP DRRM"
              className="h-12 max-w-full object-contain"
            />
          </div>
          <img
            src={UPNAME}
            alt="UP Name"
            className="h-12 max-w-full object-contain"
          />
        </div>

        {/* Admin Info */}
        <div className="text-center mb-6">
          <p className="text-lg font-bold">Admin Panel</p>
          {adminName ? (
            <p className="text-sm text-gray-200">{adminName}</p>
          ) : null}
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <Link
            to="/admin/manual-post"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <BookOpenText size={25} /> Manuals
            </div>
            <span className="bg-white text-red-800 text-sm font-bold px-2 py-1 rounded">
              {manualCount}
            </span>
          </Link>

          <Link
            to="/admin/orders"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <PackageOpenIcon size={25} /> Orders
            </div>
            <span className="bg-white text-red-800 text-sm font-bold px-2 py-1 rounded">
              {pendingOrdersCount}
            </span>
          </Link>

          <Link
            to="/admin/news-post"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Newspaper size={25} /> News
            </div>
          </Link>

          <Link
            to="/admin/reviews-post"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <MessageSquareQuote size={25} /> Reviews
            </div>
          </Link>

          <Link
            to="/admin/faqs"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <MessageSquareQuote size={25} /> FAQs
            </div>
          </Link>

          {/* ✅ NEW: Contact Submissions */}
          <Link
            to="/admin/contact-submissions"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Inbox size={25} /> Contact Submissions
            </div>
          </Link>
          {/* Careers */}
          <Link
            to="/admin/careers"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Briefcase size={25} /> Careers
            </div>
          </Link>
          {/* ✅ Gmail Accounts */}
          <Link
            to="/admin/gmail-accounts"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Mail size={25} /> Gmail Accounts
            </div>
            <span className="bg-white text-red-800 text-sm font-bold px-2 py-1 rounded">
              {pendingUsersCount}
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center justify-between px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex items-center gap-2">
              <Globe size={25} /> Website
            </div>
          </Link>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center text-white font-semibold text-sm px-4 py-2 bg-red-800 rounded hover:bg-gray-700 transition mt-auto gap-2 text-center"
        >
          <LogOutIcon size={25} /> Log Out
        </button>

        <button
          className="md:hidden mt-4 text-white"
          onClick={() => setMenuOpen(false)}
        >
          Close
        </button>
      </div>

      {/* Mobile Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;