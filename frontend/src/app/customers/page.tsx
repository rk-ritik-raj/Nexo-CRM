"use client";

import { useEffect, useState } from "react";
import axios from "axios";
// import { formatDistanceToNow } from "date-fns"; // Using date-fns for date formatting
import {
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Database,
  Plus,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // Wait, check if date-fns is in package.json. If not, write a standard date formatter to avoid missing dependency errors. Yes, let's write a custom date formatter to be 100% safe!

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"shoppers" | "orders">("shoppers");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const custRes = await axios.get("https://nexo-crm-jjow.onrender.com/api/customers");
      const orderRes = await axios.get("https://nexo-crm-jjow.onrender.com/api/orders");
      setCustomers(custRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error("Error fetching customers/orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await axios.post("https://nexo-crm-jjow.onrender.com/api/customers/ingest-sample");
      await fetchData();
    } catch (err) {
      console.error("Error seeding data", err);
      alert("Seeding failed. Make sure your backend server is running on port 5000.");
    } finally {
      setSeeding(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " (" + date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }) + ")";
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Shopper Database
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Ingest, manage, and view customer purchase profiles and history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            <Database className="h-4 w-4 text-violet-400" />
            {seeding ? "Resetting & Seeding..." : "Reset & Ingest Sample Data"}
          </button>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all duration-200"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-zinc-800 mb-6 gap-6">
        <button
          onClick={() => setActiveTab("shoppers")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "shoppers"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shoppers ({customers.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "orders"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Orders Ledger ({orders.length})
          </div>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
            <span className="text-zinc-400 text-sm">Loading records...</span>
          </div>
        </div>
      ) : activeTab === "shoppers" ? (
        /* Customers Tab */
        <div className="bg-zinc-950/45 border border-zinc-900 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
          {customers.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Users className="h-12 w-12 mx-auto text-zinc-700 mb-3" />
              <p className="text-lg font-medium">No shoppers found</p>
              <p className="text-sm text-zinc-650 max-w-md mx-auto mt-1">
                Click "Reset & Ingest Sample Data" above to instantly load a rich, simulated history of consumer purchasing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-900 text-zinc-400 font-medium">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 text-right">Total Spend</th>
                    <th className="p-4 text-right">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {customers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="hover:bg-zinc-900/20 transition-all duration-150 text-zinc-300 group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-indigo-400 text-sm group-hover:bg-indigo-950/20 group-hover:border-indigo-800 transition-colors duration-200">
                            {customer.name.split(" ").map((n: any) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-100">{customer.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {customer._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">  
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                          {customer.city || "Unknown"}
                        </div>
                      </td>
                      <td className="p-4 text-xs space-y-0.5">
                        <div className="text-zinc-300 font-mono">{customer.email}</div>
                        <div className="text-zinc-500 font-mono">{customer.phone || "-"}</div>
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-400 font-mono">
                        ${customer.totalSpend?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-xs text-zinc-400">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-650" />
                          {formatDate(customer.lastPurchaseDate)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Orders Tab */
        <div className="bg-zinc-950/45 border border-zinc-900 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <ShoppingBag className="h-12 w-12 mx-auto text-zinc-700 mb-3" />
              <p className="text-lg font-medium">No orders recorded</p>
              <p className="text-sm text-zinc-650 max-w-md mx-auto mt-1">
                Make sure to load shopper records, and any purchases made via campaign links will write orders here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-900 text-zinc-400 font-medium">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4 text-center">Items Count</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-right">Purchase Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-zinc-900/20 transition-all duration-150 text-zinc-300"
                    >
                      <td className="p-4 font-mono text-xs text-indigo-400">
                        {order._id}
                      </td>
                      <td className="p-4">
                        {order.customerId ? (
                          <div>
                            <div className="font-semibold text-zinc-150">
                              {order.customerId.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {order.customerId.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600 italic">Unknown Customer</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold text-zinc-400">
                        {order.items || 1}
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-400 font-mono">
                        ${order.amount?.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-xs text-zinc-400 font-mono">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Inline helper for class concatenation
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
