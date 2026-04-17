import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { Pencil, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyPurchase = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("pending"); // Default: Pending Orders
  const [customer, setCustomer] = useState(null); // Store customer details
  const [totalCartItems, setTotalCartItems] = useState(0);

  const [showEditForm, setShowEditForm] = useState(false); // Edit form visibility
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    contact: "",
    address: "",
    email: "",
  });

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) return;
  
        const userRef = doc(db, "users", user.uid);
        const cartUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const cart = docSnap.data().cart || [];
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            setTotalCartItems(totalItems);
          }
        });
  
        return () => cartUnsubscribe();
      });
  
      return () => unsubscribe();
    }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setOrders([]);
        setCustomer(null);
        return;
      }

      // Fetch Customer Details (from "users" collection)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedCustomer = {
          name: userData.addressInfo?.name || "N/A",
          email: userData.email || "N/A",
          contact: userData.addressInfo?.contact || "N/A",
          address: userData.addressInfo?.address || "N/A",
        };

        setCustomer(updatedCustomer);
        setCustomerInfo(updatedCustomer); // Initialize edit form fields
      } else {
        setCustomer(null);
      }

      // Fetch Orders (from "orders" collection)
      const orderRef = collection(db, "orders");
      const q = query(orderRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const orderList = [];
      querySnapshot.forEach((doc) => orderList.push({ id: doc.id, ...doc.data() }));
      setOrders(orderList);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Update filtered orders when orderFilter changes
  useEffect(() => {
    const filtered = orders.filter((order) => order.status.toLowerCase() === orderFilter);
    setFilteredOrders(filtered);
  }, [orderFilter, orders]);

  return (
    <div className="p-6 mt-20 block lg:flex gap-8">
      {/* Sidebar: Customer Profile */}
      <div className="lg:w-1/3 bg-gray-100 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Customer Details</h2>
          <button onClick={() => setShowEditForm(true)}>
            <Pencil size={20} className="text-gray-600 hover:text-gray-800 cursor-pointer" />
          </button>
        </div>
        {customer ? (
          <div className="text-sm">
            <p className="my-2"><strong>Name:</strong> {customer.name}</p>
            <p className="my-2"><strong>Contact Number:</strong> {customer.contact}</p>
            <p className="my-2"><strong>Address:</strong> {customer.address}</p>
            <p className="my-2"><strong>Email:</strong> {customer.email}</p>
          </div>
        ) : (
          <p>Loading customer details...</p>
        )}
      </div>

      {/* Orders Section */}
      <div className="lg:w-2/3 mt-4">
        <div className="flex items-center justify-between mb-4 ">
          <h2 className="text-2xl font-bold">My Purchase</h2>
          <button
            onClick={() => navigate("/cart")}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 hover:bg-yellow-600 transition"
          >
            Cart ({totalCartItems})
          </button>
        </div>
        
        {/* Navigation Tabs for Pending & Completed Orders */}
        <div className="flex mb-6 w-full">
          <button 
            className={`px-4 py-2 w-full ${orderFilter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}
            onClick={() => setOrderFilter("pending")}
          >
            Pending Orders
          </button>
          <button 
            className={`px-4 py-2 w-full ${orderFilter === "processed" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}
            onClick={() => setOrderFilter("processed")}
          >
            Processed Orders
          </button>
          <button 
            className={`px-4 py-2 w-full ${orderFilter === "completed" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}
            onClick={() => setOrderFilter("completed")}
          >
            Completed Orders
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <p className="text-gray-500">No {orderFilter} orders found.</p>
        ) : (
          <ul className="space-y-4">
            {filteredOrders.map((order) => {
              const firstItem = order.cartItems?.[0]; // Get first item
              return (
                <li 
                  key={order.id} 
                  className="border border-gray-300 rounded-lg shadow-md "
                >
                  <div className="flex justify-between p-4">
                    <p className={`font-bold uppercase ${orderFilter === "pending" ? "text-red-900" : 
                    order.status === "processed" ? "text-orange-700" : 
                    "text-green-900"}`}>{order.status} </p>
                    <p className="text-gray-700 text-sm font-medium">
                    (Items: {order.cartItems.reduce((total, item) => total + item.quantity, 0)}) 
                    <span className="text-red-900 text-xl ml-1">₱{order.cartItems.reduce((total, item) => total + item.price * item.quantity, 0)} </span>
                      
                      
                    </p>
                  </div>
                  <div className="flex items-center gap-4 px-4 pb-4">
                    {/* Display only first item */}
                    {firstItem && (
                      <img
                        src={`http://localhost:5000${firstItem.imageUrl}`}
                        alt={firstItem.title}
                        className="h-16 w-16 object-cover rounded"
                      />
                    )}
                    <div className="flex justify-between w-full items-center">
                      {/* <p><strong>Order ID:</strong> {order.id}</p> */}
                      <p><span className="text-sm text-gray-500">{firstItem?.category || "No Items"}</span> <br />{firstItem?.title || "No Items"}</p>
                      <p className="text-gray-600">x{firstItem?.quantity}</p>
                    </div>
                  </div>
                  <button 
                    className="px-4 py-2 w-full flex justify-between bg-gray-200 rounded-b-lg"
                    onClick={() => navigate(`/order/${order.id}`, { state: { order } })}
                  >
                    View Details
                    <ChevronRight size={20}/>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyPurchase;
