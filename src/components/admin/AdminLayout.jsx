import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminDashboard from "./AdminDashboard.jsx";
import ManualPost from "./ManualPost.jsx";
import Sidebar from "./AdminSidebar.jsx";
import AdminHeader from "./AdminHeader.jsx";
import Orders from "./Orders.jsx";
import NewsPost from "./NewsPost.jsx";
import ReviewsPost from "./ReviewsPost.jsx";
import FAQManager from "./FAQManager.jsx";
import CareersManager from "./CareersManager.jsx";
import GmailAccounts from "./GmailAccounts.jsx";

// ✅ NEW: import your Contact Submissions page
import ContactSubmissionsTab from "./ContactSubmission.jsx"; // make sure filename matches

function AdminLanding() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-gray-700">
        Use the sidebar to open Manuals, Orders, News, Reviews, FAQs, etc.
      </p>
    </div>
  );
}

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuToggle={() => setMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 pt-20 md:pt-6">
          <Routes>
            {/* ✅ IMPORTANT: no auto redirect to manual-post */}
            <Route path="/" element={<AdminLanding />} />

            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="news-post" element={<NewsPost />} />
            <Route path="manual-post" element={<ManualPost />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reviews-post" element={<ReviewsPost />} />
            <Route path="faqs" element={<FAQManager />} />
            <Route path="gmail-accounts" element={<GmailAccounts />} />
            <Route path="careers" element={<CareersManager />} />
            <Route path="contact-submissions"element={<ContactSubmissionsTab />} />


            {/* ✅ If route not found inside /admin, go back to /admin */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;