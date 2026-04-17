import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";


const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setCartItems(userData.cart || []);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchCart();
      }
    });

    return () => unsubscribe();
  }, []);

  const updateQuantity = async (manualId, newQuantity) => {
    if (!auth.currentUser) return;
  
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
  
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
  
      let updatedCart = userSnap.data().cart.map(item =>
        item.manualId === manualId ? { ...item, quantity: Math.max(1, newQuantity) } : item
      );
  
      await updateDoc(userRef, { cart: updatedCart });
      setCartItems(updatedCart);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };
  
  const removeFromCart = async (manual) => {
    if (!auth.currentUser) return;
  
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
  
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
  
      const updatedCart = cartItems.filter((item) => item.manualId !== manual.manualId);
  
      await updateDoc(userRef, { cart: updatedCart });
  
      setCartItems(updatedCart);
  
      showPopup("❌ Item removed from cart!");
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImageUrls = files.map(file => URL.createObjectURL(file));
  
    // ✅ Append instead of replacing
    setImageUrls(prevUrls => [...prevUrls, ...newImageUrls]);
  };
  

  const showPopup = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
  
    const user = auth.currentUser;
    if (!user) return;
  
    navigate("/checkout", { state: { cartItems } });
  
    // ❌ Do NOT clear the cart here
    // await updateDoc(userRef, { cart: [] });
    // setCartItems([]);
  };
  

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  

  return (
    <div className="p-6 mt-20">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="text-white hover:bg-yellow-600 rounded-full bg-yellow-500 mr-4"><ChevronLeft size={35} /></button>
        <h2 className="text-2xl font-bold">My Cart</h2>
      </div>

      {cartItems.length > 0 ? (
        <div className="overflow-x-auto">
              
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.manualId} className="text-center border-b border-gray-300">
                  <td className="text-left px-4 py-2 flex gap-4 items-center">
                    <img
                      src={`http://localhost:5000${item.imageUrl}`}
                      alt={item.title}
                      className="h-16 w-16 object-cover rounded"
                    />
                      <p ><span className="text-sm text-gray-500">{item.category} </span><br />{item.title}</p>
                  </td>
                  <td className=" px-4 py-2 text-red-900 font-bold">₱ {item.price}.00</td>
                  <td className=" px-4 py-2 gap-2">
                    <button
                      onClick={() => updateQuantity(item.manualId, item.quantity - 1)}
                      className="mx-3 px-3 py-1 bg-gray-300 rounded"
                    >
                      -
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button
                      onClick={() => updateQuantity(item.manualId, item.quantity + 1)}
                      className="mx-3 px-3 py-1 bg-gray-300 rounded"
                    >
                      +
                    </button>
                  </td>
                  <td className=" px-4 py-2">₱ {item.price * item.quantity}.00</td>
                  <td className=" px-4 py-2">
                    <button
                      onClick={() => removeFromCart(item)}
                      className="text-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Checkout Button */}
          <div className="flex justify-end mt-4 gap-4 items-center">
            <div>
            <p className="text-md">Subtotal: <span className="text-2xl text-red-900 font-bold">₱{totalPrice}.00</span></p>
            <p className="text-md">No. Items: <span className="font-bold text-red-900">({totalCartQuantity})</span></p>
            </div>
            
            <button
              onClick={handleCheckout}
              className="bg-yellow-500  text-xl  text-white px-4 py-2 rounded shadow-lg hover:bg-yellow-600"
            >
              Checkout
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Your cart is empty.</p>
      )}

      {/* Pop-up Message */}
      {message && (
        <div className="fixed inset-0 flex justify-center items-center z-50">
          <div className="bg-black/60 text-white text-2xl font-bold px-6 py-4 rounded-lg shadow-lg">
            {message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;