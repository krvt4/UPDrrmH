import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ReceiptText,
  XIcon,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("total");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!courier || !receiptImage) {
      console.error("❌ Courier and receipt image are required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("receipt", receiptImage);

      const response = await fetch("http://localhost:5000/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("❌ Failed to upload receipt");

      const data = await response.json();
      const fullReceiptUrl = `http://localhost:5000${data.receiptUrl}`;

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        courier,
        processedTime: serverTimestamp(),
        receiptUrl: fullReceiptUrl,
      });

      const updatedDoc = await getDoc(orderRef);
      const updatedData = updatedDoc.data();

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                courier,
                processedTime: updatedData.processedTime,
                receiptUrl: fullReceiptUrl,
              }
            : order
        )
      );

      setSelectedOrder(null);
      setReceiptImage(null);
      setCourier("");
    } catch (error) {
      console.error("❌ Error updating order:", error);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setCourier(order.courier || "");
    setReceiptImage(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) setReceiptImage(file);
  };

  const filteredOrders = orders.filter((order) => {
    const name = order.customerInfo?.name?.toLowerCase() || "";
    const id = order.id?.toLowerCase() || "";
    const status = order.status?.toLowerCase() || "";

    const term = searchTerm.toLowerCase();
    return name.includes(term) || id.includes(term) || status.includes(term);
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const filteredStatus = [...filteredOrders].filter((order) => {
    if (statusFilter === "pending") {
      return order.status === "pending";
    } else if (statusFilter === "processed") {
      return order.status === "processed";
    } else {
      return order;
    }
  });

  const sortedOrders = [...filteredStatus].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return sortOrder === "asc"
      ? a.createdAt.toDate() - b.createdAt.toDate()
      : b.createdAt.toDate() - a.createdAt.toDate();
  });

  return (
    // ✅ FIXED: no lg:ml-68, no px-auto
    <div className="w-full py-6 px-6">
      {/* OVERVIEW */}
      <div className="mb-5">
        <h2 className="font-bold mb-4 text-3xl text-center">Overview</h2>

        <div className="flex gap-6 flex-wrap">

          <button onClick={() => setStatusFilter("total")} className="cursor-pointer">
            <div className={`p-6 rounded-lg shadow-md flex-1 min-w-[250px]
                      ${
                        statusFilter === "total"
                          ? "bg-white"
                          : "bg-gray-100"
                      }`}>
              <div className="flex justify-between">
                <h3 className="font-semibold">Total Orders</h3>
                <p className="text-gray-700 text-5xl font-semibold">
                  {orders.filter((o) => o.status).length}
                </p>
              </div>
              <p className="text-gray-700">
                Total Amount: ₱{" "}
                {orders
                  .filter((o) => o.status)
                  .reduce(
                    (acc, o) =>
                      acc +
                      o.cartItems.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      ),
                    0
                  )}
                .00
              </p>
            </div>
          </button>

          <button onClick={() => setStatusFilter("pending")} className="cursor-pointer">
          <div className={`p-6 rounded-lg shadow-md flex-1 min-w-[250px]
                      ${
                        statusFilter === "pending"
                          ? "bg-red-300"
                          : "bg-red-100 hover:bg-red-200"
                      }`}>
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-red-900">Pending</h3>
              <p className="text-gray-700 text-5xl font-semibold">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
            <p className="text-gray-700">
              Total Amount: ₱{" "}
              {orders
                .filter((o) => o.status === "pending")
                .reduce(
                  (acc, o) =>
                    acc +
                    o.cartItems.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ),
                  0
                )}
              .00
            </p>
          </div>
          </button>

          <button onClick={() => setStatusFilter("processed")} className="cursor-pointer">
          <div className={`p-6 rounded-lg shadow-md flex-1 min-w-[250px]
                      ${
                        statusFilter === "processed"
                          ? "bg-green-300"
                          : "bg-green-100 hover:bg-green-200"
                      }`}>
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-green-900">Processed</h3>
              <p className="text-gray-700 text-5xl font-semibold">
                {orders.filter((o) => o.status === "processed").length}
              </p>
            </div>
            <p className="text-gray-700">
              Total Amount: ₱{" "}
              {orders
                .filter((o) => o.status === "processed")
                .reduce(
                  (acc, o) =>
                    acc +
                    o.cartItems.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ),
                  0
                )}
              .00
            </p>
          </div>
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-3xl font-bold">Orders</h2>

        <div className="flex items-center border border-zinc-300 px-3 py-2 rounded-lg gap-2 bg-white">
          <Search className="text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:outline-none w-[220px]"
          />
        </div>
      </div>

      {/* ✅ FIXED TABLE WRAPPER */}
      {filteredOrders.length > 0 ? (
        <div className="w-full overflow-x-auto bg-white rounded shadow border">
          <table className="min-w-[1000px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="p-2">Order ID</th>
                <th className="px-4 py-2">Customer</th>
                <th className="p-2">Items</th>
                <th className="px-4 py-2">Total Price</th>
                <th className="px-4 py-2">
                  <button
                    onClick={toggleSortOrder}
                    className="inline-flex gap-1 items-center justify-center w-full"
                  >
                    Order At
                    {sortOrder === "desc" ? (
                      <ArrowDown size={20} className="text-gray-500" />
                    ) : (
                      <ArrowUp size={20} className="text-gray-500" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {sortedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer text-center border-b border-gray-300 text-sm hover:bg-gray-50"
                  onClick={() => handleOrderClick(order)}
                >
                  <td className="p-2 text-gray-600">{order.id}</td>
                  <td className="px-4 py-2">{order.customerInfo?.name || "Unknown"}</td>
                  <td className="px-4 py-2">
                    {order?.cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0}
                  </td>

                  <td className="px-4 py-2 text-red-900 font-bold">
                    ₱{" "}
                    {order.cartItems?.reduce(
                      (acc, item) => acc + item.price * item.quantity,
                      0
                    )}
                    .00
                  </td>

                  <td className="px-4 py-2">
                    {order.createdAt?.toDate().toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }) || "N/A"}
                  </td>

                  <td className="px-4 py-2">
                    <p
                      className={`rounded-lg px-4 py-1 font-bold inline-block
                      ${
                        order.status === "pending"
                          ? "bg-red-200 text-red-900"
                          : order.status === "processed"
                          ? "bg-orange-200 text-orange-900"
                          : "bg-green-200 text-green-900"
                      }`}
                    >
                      {order.status}
                    </p>
                  </td>

                  <td className="px-4 py-2">
                    <button className="text-gray-500 px-3 py-1">
                      <ReceiptText size={26} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500">No orders found.</p>
      )}

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 !bg-gray-800/50 flex items-center justify-center p-4 z-30">
          <div className="text-sm bg-white p-6 rounded-lg w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xl">
                <strong>Order ID :</strong> {selectedOrder.id}
              </p>
              <button
                className="text-gray-600"
                onClick={() => setSelectedOrder(null)}
              >
                <XIcon size={30} />
              </button>
            </div>

            <div className="flex items-center">
              <p className="py-1 font-bold w-28">Customer:</p>
              <p>{selectedOrder.customerInfo?.name}</p>
            </div>
            <div className="flex items-center">
              <p className="py-1 font-bold w-28">Contact:</p>
              <p>{selectedOrder.customerInfo?.contact}</p>
            </div>
            <div className="flex items-center">
              <p className="py-1 font-bold w-28">Address:</p>
              <p>{selectedOrder.customerInfo?.address}</p>
            </div>
            <div className="flex items-center">
              <p className="py-2 font-bold w-28">Order Time:</p>
              <p>
                {selectedOrder.createdAt?.toDate().toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }) || "N/A"}
              </p>
            </div>

            <table className="w-full border-collapse border border-gray-300 mb-4 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border text-left">Item</th>
                  <th className="px-4 py-2 border text-left">Category</th>
                  <th className="px-4 py-2 border text-left">Price</th>
                  <th className="px-4 py-2 border text-left">Qnty.</th>
                  <th className="px-4 py-2 border text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.cartItems.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2 border">{item.title}</td>
                    <td className="px-4 py-2 border">{item.category}</td>
                    <td className="px-4 py-2 border">₱{item.price}.00</td>
                    <td className="px-4 py-2 border text-center">{item.quantity}</td>
                    <td className="px-4 py-2 border font-bold">
                      ₱{item.price * item.quantity}.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-4">
              <h3 className="font-semibold py-1">Courier Service:</h3>
              {selectedOrder.courier ? (
                <p className="py-2">{selectedOrder.courier}</p>
              ) : (
                <div className="flex gap-4 flex-wrap">
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
              )}
            </div>

            <h3 className="font-semibold py-1 mt-4">Delivery Receipt:</h3>
            {selectedOrder.receiptUrl ? (
              <img
                src={
                  selectedOrder.receiptUrl.startsWith("http")
                    ? selectedOrder.receiptUrl
                    : `http://localhost:5000${selectedOrder.receiptUrl}`
                }
                alt="Receipt"
                className="mt-2 w-32 h-32 object-cover border rounded cursor-pointer hover:scale-105 transition"
                onClick={() => setZoomedImage(selectedOrder.receiptUrl)}
                onError={(e) => (e.target.style.display = "none")}
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="mt-2"
              />
            )}

            {zoomedImage && (
              <div className="fixed inset-0 !bg-black/70 flex justify-center items-center z-50">
                <div className="relative">
                  <button
                    className="absolute top-2 right-2 !bg-black/50 text-white p-2"
                    onClick={() => setZoomedImage(null)}
                  >
                    ✖
                  </button>
                  <img
                    src={zoomedImage}
                    alt="Zoomed Receipt"
                    className="max-w-full max-h-[90vh] rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6">
              {selectedOrder.status !== "processed" && (
                <button
                  className={`px-4 py-2 rounded ${
                    courier && receiptImage
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!courier || !receiptImage}
                  onClick={() => updateOrderStatus(selectedOrder.id, "processed")}
                >
                  Process Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;