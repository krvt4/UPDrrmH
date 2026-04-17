import React, { useLayoutEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./index.css";

import EmailVerified from "./components/EmailVerified.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Body from "./components/Body.jsx";
import AboutUs from "./components/AboutUs.jsx";
import News from "./components/News.jsx";
import NewsDetail from "./components/NewsDetail.jsx";
import EventDetail from "./components/EventDetails.jsx";
import Trainings from "./components/Berts.jsx";
import Training2 from "./components/Mci.jsx";
import Training3 from "./components/SFATBLS.jsx";
import ELearning from "./components/E-Learning.jsx";
import Shop from "./components/Shop.jsx";
import Careers from "./components/Careers.jsx";
import ManualDetail from "./components/ManualDetail.jsx";
import OrderDetail from "./components/OrderDetails.jsx";
import CartPage from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import Profile from "./components/Profile.jsx";
import TermsCondition from "./components/TermsCondition.jsx";
import Achievements from "./components/Achievements.jsx";
import VerifyOTP from "./components/VerifyOTP.jsx";
import Projects from "./components/Projects.jsx";

import AdminLogin from "./components/admin/AdminLoginForm.jsx";
import PrivateRoute from "./components/admin/PrivateRoute.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";

import UserPanel from "./components/UserPanel.jsx";
import EditProfile from "./components/EditProfile.jsx";

import RequireAuth from "./components/admin/RequireAuth.jsx";
import Chatbot from "./components/Chatbot.jsx";

const PublicLayout = ({ children }) => {
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      if (headerRef.current) {
        setHeaderH(headerRef.current.offsetHeight);
      }
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div ref={headerRef}>
        <Header />
      </div>

      <main className="flex-1" style={{ paddingTop: headerH }}>
        {children}
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Body />
          </PublicLayout>
        }
      />

      <Route
        path="/about-us"
        element={
          <PublicLayout>
            <AboutUs />
          </PublicLayout>
        }
      />

      <Route
        path="/verify-otp"
        element={
          <PublicLayout>
            <VerifyOTP />
          </PublicLayout>
        }
      />

      <Route
        path="/cart"
        element={
          <PublicLayout>
            <CartPage />
          </PublicLayout>
        }
      />

      <Route
        path="/news"
        element={
          <PublicLayout>
            <News />
          </PublicLayout>
        }
      />

      <Route
        path="/news/:id"
        element={
          <PublicLayout>
            <NewsDetail />
          </PublicLayout>
        }
      />

      <Route
        path="/events/:id"
        element={
          <PublicLayout>
            <EventDetail />
          </PublicLayout>
        }
      />

      <Route
        path="/training1"
        element={
          <PublicLayout>
            <Trainings />
          </PublicLayout>
        }
      />

      <Route
        path="/training2"
        element={
          <PublicLayout>
            <Training2 />
          </PublicLayout>
        }
      />

      <Route
        path="/training3"
        element={
          <PublicLayout>
            <Training3 />
          </PublicLayout>
        }
      />

      <Route
        path="/e-learning"
        element={
          <PublicLayout>
            <ELearning />
          </PublicLayout>
        }
      />

      <Route
        path="/shop"
        element={
          <PublicLayout>
            <Shop />
          </PublicLayout>
        }
      />

      <Route
        path="/careers"
        element={
          <PublicLayout>
            <Careers />
          </PublicLayout>
        }
      />

      <Route
        path="/achievements"
        element={
          <PublicLayout>
            <Achievements />
          </PublicLayout>
        }
      />

      <Route
        path="/projects"
        element={
          <PublicLayout>
            <Projects />
          </PublicLayout>
        }
      />

      <Route
        path="/manual-detail"
        element={
          <PublicLayout>
            <ManualDetail />
          </PublicLayout>
        }
      />

      <Route
        path="/terms-condition"
        element={
          <PublicLayout>
            <TermsCondition />
          </PublicLayout>
        }
      />

      {/* Protected User Routes */}
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <PublicLayout>
              <Profile />
            </PublicLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/checkout"
        element={
          <RequireAuth>
            <PublicLayout>
              <Checkout />
            </PublicLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/order/:orderId"
        element={
          <RequireAuth>
            <PublicLayout>
              <OrderDetail />
            </PublicLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/user-panel"
        element={
          <RequireAuth disallowVisitor={true}>
            <PublicLayout>
              <UserPanel />
            </PublicLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/edit-profile"
        element={
          <RequireAuth disallowVisitor={true}>
            <PublicLayout>
              <EditProfile />
            </PublicLayout>
          </RequireAuth>
        }
      />

      {/* Email Verified */}
      <Route
        path="/email-verified"
        element={
          <PublicLayout>
            <EmailVerified />
          </PublicLayout>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin-login" element={<AdminLogin />} />

      <Route
        path="/admin/*"
        element={
          <PrivateRoute redirectTo="/">
            <AdminLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;