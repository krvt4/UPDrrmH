import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { doc, collection, addDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/firebase";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems = [] } = location.state || {}; // Ensure cartItems is an array

  // State for customer details
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    address: "",
    contact: "",
    notes: "",
  });

  // Redirect user if no cart items
  useEffect(() => {
    if (cartItems.length === 0) {
      alert("Your cart is empty. Redirecting to shop...");
      navigate("/shop");
    }
  }, [cartItems, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

  // Handle Checkout
  const handleCheckout = async () => {
    if (!auth.currentUser) {
      alert("Please log in to checkout.");
      return;
    }

    if (!customerInfo.name || !customerInfo.address || !customerInfo.contact) {
      alert("Please fill in all required fields.");
      return;
    }

    const userRef = doc(db, "users", auth.currentUser.uid);

    try {
      // Save the order
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser.uid,
        cartItems,
        customerInfo,
        status: "pending",
        createdAt: new Date(),
      });

      // Clear cart in Firestore after checkout
      await updateDoc(userRef, { cart: [] });

      alert("Order placed successfully!");
      navigate("/shop"); // Redirect after checkout
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  return (
    <div className="p-6 mt-20 w-full">
  <h1 className="text-2xl font-bold mb-4">🛒 Checkout</h1>
  <div className="block lg:flex">
    {/* Cart Table */}
    <div className="lg:w-2/3">
      <table className="border-collapse border border-gray-300 mb-4 w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Item</th>
            <th className="border px-4 py-2">Price</th>
            <th className="border px-4 py-2">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.manualId}>
              <td className="border px-4 py-2">{item.title}</td>
              <td className="border px-4 py-2">₱ {item.price}.00</td>
              <td className="border px-4 py-2">{item.quantity || 1}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Customer Details Form */}
      <div className="p-4 bg-white border rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Customer Details</h2>
        <div className="mb-4">
          <label className="block font-semibold">Name:</label>
          <input
            type="text"
            name="name"
            value={customerInfo.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Address:</label>
          <input
            type="text"
            name="address"
            value={customerInfo.address}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Contact Number:</label>
          <input
            type="text"
            name="contact"
            value={customerInfo.contact}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold">Message Notes:</label>
          <textarea
            name="notes"
            value={customerInfo.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>
      </div>
    </div>

    {/* Order Summary Section */}
    <div className="lg:w-1/3 lg:ml-6 p-4">
      <h2 className="text-xl font-semibold mb-3">📦 Order Summary</h2>
      <p className="text-lg text-gray-500">Total Items: {cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</p>
      <p className="text-lg text-gray-500">Subtotal: ₱{cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)}.00</p>

      {/* Shipping Information */}
      {/* <div className="mt-4 p-3 bg-white border rounded">
        <h3 className="text-lg font-semibold">Shipping Information</h3>

        <p><strong>Name:</strong> {customerInfo.name || "N/A"}</p>
        <p><strong>Address:</strong> {customerInfo.address || "N/A"}</p>
        <p><strong>Contact:</strong> {customerInfo.contact || "N/A"}</p>
      </div> */}
      <div>
                <h2 className="text-xl font-semibold mb-3">Delivery Information</h2>
                <p className="text-lg font-bold flex items-center gap-2"><span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/></svg> </span> Pick-up Address</p>
                <p>
                  670 Padre Faura St, Ermita, Manila, 1000 Metro Manila
                </p>
                <p className="font-bold">UPMNL-DDRM-H • 09208014528</p>
                <hr  className="border-gray-300 my-5"/>
                <p className="text-lg font-bold flex items-center gap-2"><span><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></span> Drop-Off Address</p>
                <button  className="mt-4 p-2 bg-green-600 text-white rounded-lg w-full" >Add Drop-off Address</button>
              </div>

      {/* Confirm Order Button */}
      <button
        onClick={handleCheckout}
        className="w-full mt-4 bg-green-600 text-white py-2 rounded shadow hover:bg-green-700"
      >
        ✅ Confirm Order
      </button>
    </div>
  </div>
</div>
  );
};

export default Checkout;