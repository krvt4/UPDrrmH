import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { doc, collection, addDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/firebase";
import { Pencil, Truck, Package, ChevronLeft, XIcon } from "lucide-react";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showTermsCondition, setShowTermsCondition] = useState(false);
  const { cartItems = [] } = location.state || {};
  const [courier, setCourier] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    address: "",
    contact: "",
    notes: "",
  });

  useEffect(() => {
    const fetchAddress = async () => {
      if (!auth.currentUser) return;
  
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists() && userSnap.data().addressInfo) {
        setCustomerInfo(userSnap.data().addressInfo);
      }
    };
  
    fetchAddress();
  }, [auth.currentUser]); 

  useEffect(() => {
    if (cartItems.length === 0) {
      alert("Your cart is empty. Redirecting to shop...");
      navigate("/shop");
    }
  }, [cartItems, navigate]);

  const handleChange = (e) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      alert("Please log in to checkout.");
      return;
    }
  
    if (!customerInfo.name || !customerInfo.address || !customerInfo.contact) {
      alert("Please fill in all required fields.");
      return;
    }
  
    if (!courier) {
      alert("Please select a preferred courier service.");
      return;
    }
  
    if (!agreedToTerms) {
      alert("You must agree to the Terms and Conditions before proceeding.");
      return;
    }
  
    const userRef = doc(db, "users", auth.currentUser.uid);
    
    try {
      const batchUpdates = [];
      for (const item of cartItems) {
        const manualRef = doc(db, "manuals", item.manualId);
        const manualSnap = await getDoc(manualRef);
  
        if (manualSnap.exists()) {
          const currentStock = manualSnap.data().stock || 0;
          const newStock = currentStock - (item.quantity || 1);
  
          if (newStock < 0) {
            alert(`Not enough stock for ${item.title}`);
            return;
          }
  
          batchUpdates.push(updateDoc(manualRef, { stock: newStock }));
        }
      }
  
      await Promise.all(batchUpdates);
  
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser.uid,
        cartItems,
        customerInfo,
        courier, 
        status: "pending",
        createdAt: new Date(),
      });
  
      await updateDoc(userRef, { addressInfo: customerInfo, cart: [] });
  
      setMessage("Order placed successfully! Please wait for the staff to contact you if your order is being processed.");
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };
  
  
  

  const showPopup = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };
  
  
  return (
    <div className="p-6 mt-20 w-full">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-yellow-600 rounded-full bg-yellow-500 mr-4"><ChevronLeft size={35} /></button>
        <h2 className="text-2xl font-bold">Checkout</h2>
      </div>
  
      <div className="block lg:flex">
        {/* Cart Table */}
        <div className="lg:w-2/3">
          <table className="border-collapse  mb-4 w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.manualId} className="border-b border-gray-300">
                  <td className="flex p-4 gap-4 items-center">
                        <img
                          src={`http://localhost:5000${item.imageUrl}`}
                          alt={item.title}
                          className="h-16 w-16 object-cover rounded"
                        />
                        <p ><span className="text-sm text-gray-500">{item.category} </span><br />{item.title}</p>
                        </td>
                  <td className=" text-center p-4">₱ {item.price}.00</td>
                  <td className=" text-center p-4">{item.quantity || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {showCustomerDetails && (
            <div className="fixed inset-0 !bg-black/50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-3">Edit Drop-Off Address</h2>
                <div className="mb-4">
                  <label className="block font-semibold">Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-500 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold">Address:</label>
                  <input
                    type="text"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-500 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold">Contact Number:</label>
                  <input
                    type="text"
                    name="contact"
                    value={customerInfo.contact}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-500 rounded"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    className="mr-2 px-4 py-2 text-white rounded bg-gray-500  hover:bg-gray-600" 
                    onClick={() => setShowCustomerDetails(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded" 
                    onClick={async () => {
                      if (!auth.currentUser) return;
                      const userRef = doc(db, "users", auth.currentUser.uid);

                      try {
                        await updateDoc(userRef, { addressInfo: customerInfo });

                        const updatedUserSnap = await getDoc(userRef);
                        if (updatedUserSnap.exists() && updatedUserSnap.data().addressInfo) {
                          setCustomerInfo(updatedUserSnap.data().addressInfo);
                        }

                        alert("Address updated successfully!");
                        setShowCustomerDetails(false);
                      } catch (error) {
                        console.error("Error updating address:", error);
                      }
                    }}
                  >
                    Save
                  </button>

                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-1/3 lg:ml-6">
          <div>
            <h2 className="text-base font-semibold bg-red-900 text-white p-2">Delivery Information</h2>
            <p className="text-lg font-bold flex items-center gap-2 my-3 text-red-900">
                  <Package
                    size={20} 
                    onClick={() => setShowCustomerDetails(true)}
                  /> Pick-up Address</p>
            
            <div className="border-l-2 border-gray-300 p-2 ml-2">
                <p className="text-lg font-bold">UPMNL-DDRM-H • 09208014528</p>
                <p className="text-gray-500">
                  670 Padre Faura St, Ermita, Manila, 1000 Metro Manila
                </p>
            </div>

            {/* Drop-Off Address with Edit Icon */}
            <p className="text-lg font-bold flex items-center gap-2 my-3 text-red-900">
                  <Truck 
                    size={20} 
                    onClick={() => setShowCustomerDetails(true)}
                  />
                  Drop-Off Address
                  <Pencil 
                    size={20} 
                    className="text-gray-500 cursor-pointer hover:text-black ml-2" 
                    onClick={() => setShowCustomerDetails(true)}
                  />
                </p>

            <div className="border-l-2 border-gray-300 p-2 ml-2">
                <p className="text-lg font-bold">{customerInfo.name} • {customerInfo.contact}</p>
                <p className="text-gray-500">
                {customerInfo.address}
                </p>
            </div>
            <h2 className="text-base font-semibold p-2 mt-4">Choose your courier service: </h2>
            <div className="flex gap-4">
              {["LALAMOVE", "DHL Express", "LBC Express"].map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={option}
                    checked={courier === option}
                    onChange={(e) => setCourier(e.target.value)}
                    className="cursor-pointer accent-red-900"
                  />
                  {option}
                </label>
              ))}
            </div>

            <h2 className="text-base font-semibold bg-red-900 text-white p-2 mt-4">Order Summary</h2>
            <div className="flex justify-between text-gray-500 my-2">
              <p>Payment Methods: </p>
              <p className="text-red-900 font-bold">Cash on Delivery</p>
            </div>
            <div className="flex justify-between text-gray-500 my-2">
              <p>Total Items: </p>
              <p className="text-red-900 font-bold">{cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}</p>
            </div>
            <div className="flex justify-between text-gray-500 my-2">
              <p>Subtotal: </p>
              <p className="text-red-900 font-bold">₱ {cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)}.00</p>
            </div>

            {!customerInfo.address && (
              <button 
                className="mt-4 p-2 bg-green-600 text-white rounded-lg w-full" 
                onClick={() => setShowAddressForm(true)}
              >
                  Add Drop-off Address
              </button>
            )}

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={() => setAgreedToTerms(!agreedToTerms)}
                className="cursor-pointer accent-red-900"
              />
              <label className="text-gray-700 text-sm">
                By submitting this order, I acknowledge that I have read and agree to the 
                <span onClick={() => setShowTermsCondition(true)} className="text-red-900 font-bold cursor-pointer"> Terms and Conditions</span>.
              </label>
            </div>

          </div>

          <button
            onClick={handleCheckout}
            className={`w-full mt-4 py-2 rounded shadow ${
              !courier || !agreedToTerms ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"
            }`}
            disabled={!courier || !agreedToTerms}
          >
            Confirm Order
          </button>
        </div>
      </div>
  {/* Pop-up Message */}
      {message && (
      <div className="fixed inset-0 flex justify-center items-center bg-black/50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-lg text-gray-700">{message}</p>
          <button
            onClick={() => {
              setMessage(""); 
              navigate("/shop"); 
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    )}

{showTermsCondition && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl max-h-[80vh] overflow-y-auto relative">
      {/* Close Button */}
      <button
        onClick={() => setShowTermsCondition(false)}
        className="absolute top-2 right-2 text-gray-600 hover:text-black"
      >
        <XIcon size={25} />
      </button>

      <h1 className="text-2xl font-bold mb-4 mt-2 text-center">Terms and Conditions</h1>
      <p className="text-justify text-gray-700 leading-relaxed">
        By placing an order through this platform, you agree to be bound by the following Terms and Conditions. Please read them carefully before proceeding with your purchase.
        <br /><br />
        <strong>1. Order Processing:</strong><br />
        All orders are subject to availability and confirmation. We reserve the right to cancel or refuse any order for any reason, including but not limited to stock issues or pricing errors.
        <br /><br />
        <strong>2. Delivery:</strong><br />
        Delivery times may vary based on your chosen courier service. We are not liable for delays caused by the courier, weather conditions, or other unforeseen events. Please ensure your delivery address and contact information are accurate.
        <br /><br />
        <strong>3. Payment:</strong><br />
        All orders must be paid upon delivery (Cash on Delivery). Please prepare the exact amount. Failure to do so may result in non-delivery or cancellation.
        <br /><br />
        <strong>4. Returns and Refunds:</strong><br />
        We do not accept returns unless the product is damaged or incorrect. Any return requests must be submitted within 48 hours of receiving the order. Refunds, if applicable, will be processed after item inspection.
        <br /><br />
        <strong>5. User Information:</strong><br />
        You are responsible for maintaining the accuracy of your personal information. This includes your name, contact number, and address. We are not responsible for failed deliveries due to incorrect information.
        <br /><br />
        <strong>6. Modification of Terms:</strong><br />
        We reserve the right to update or change these Terms and Conditions at any time without prior notice. Continued use of the service after such changes constitutes your acceptance.
        <br /><br />
        <strong>7. Privacy:</strong><br />
        Your data is stored securely and will not be shared with third parties without your consent. We value your privacy and are committed to protecting your personal information.
        <br /><br />
        By submitting your order, you acknowledge that you have read, understood, and agree to all the terms stated above.
      </p>

    </div>
  </div>
)}


</div>
  );
};

export default Checkout;