import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // Require email verification even for admin
      if (!user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email first.");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setError("User profile not found.");
        return;
      }

      const data = userSnap.data();

      if (data.role === "admin") {
        // ✅ DO NOT go directly to admin panel
        navigate("/", { replace: true });
      } else {
        await signOut(auth);
        setError("Access denied: You are not an admin.");
      }
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#7b1113]">
      <form onSubmit={handleLogin} className="bg-white shadow-lg rounded p-8">
        <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
        {error && <p className="text-[#7b1113]">{error}</p>}

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full p-2 border rounded mb-4"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 border rounded mb-4"
          required
        />

        <button
          type="submit"
          className="bg-[#04204a] hover:bg-[#02162f] text-white p-2 rounded w-full"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;