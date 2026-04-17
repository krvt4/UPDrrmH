import React, { useEffect } from "react";

function AdminDashboard() {
  useEffect(() => {
    console.log("AdminDashboard Mounted");
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p>Welcome, Admin!</p>
    </div>
  );
}

export default AdminDashboard;