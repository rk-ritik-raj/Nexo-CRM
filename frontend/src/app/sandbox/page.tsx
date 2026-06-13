"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Smartphone,
  MessageSquare,
  Mail,
  Megaphone,
  RefreshCw,
  Clock,
  User,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Wifi,
  Battery,
} from "lucide-react";
import { cn } from "@/lib/utils";

const channelIcons: { [key: string]: any } = {
  whatsapp: MessageSquare,
  sms: Smartphone,
  email: Mail,
  rcs: Megaphone,
};

const products = [
  { id: "p1", name: "Signature Coffee Beans", price: 24.99, image: "☕" },
  { id: "p2", name: "Luxe Leather Cardholder", price: 49.99, image: "💼" },
  { id: "p3", name: "Vaporist Sunglasses", price: 99.99, image: "🕶️" },
];

export default function SandboxPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Phone screen navigation states
  // 'message' | 'storefront' | 'success'
  const [screen, setScreen] = useState<"message" | "storefront" | "success">("message");
  const [purchasedProduct, setPurchasedProduct] = useState<any | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://nexo-crm-jjow.onrender.com/api/callbacks/logs");
      setLogs(res.data);
      
      // Keep selected log updated if already selected
      if (selectedLogId) {
        const found = res.data.find((l: any) => l._id === selectedLogId);
        if (found) setSelectedLog(found);
      }
    } catch (err) {
      console.error("Error loading sandbox logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSelectLog = (log: any) => {
    setSelectedLogId(log._id);
    setSelectedLog(log);
    setScreen("message"); // Reset screen to phone message
  };

  const handleLinkClick = async () => {
    if (!selectedLog) return;
    
    // Simulate "clicked" callback from link redirect
    try {
      await axios.post("https://nexo-crm-jjow.onrender.com/api/callbacks/receipt", {
        trackingId: selectedLog.trackingId,
        status: "clicked",
      });
      console.log(`Clicked tracked for: ${selectedLog.trackingId}`);
      
      // Update local status representation
      const updated = { ...selectedLog, status: "clicked" };
      setSelectedLog(updated);
      
      // Progress phone screen to simulated storefront
      setScreen("storefront");
      
      // Refresh list in background
      fetchLogs();
    } catch (err) {
      console.error("Failed to post clicked receipt", err);
    }
  };

  const handleCheckout = async (product: any) => {
    if (!selectedLog) return;

    try {
      setPurchasing(true);
      
      // Send Order request to CRM. The CRM order API will process attribution using the trackingId
      await axios.post("https://nexo-crm-jjow.onrender.com/api/orders", {
        customerId: selectedLog.customerId._id,
        amount: product.price,
        items: 1,
        trackingId: selectedLog.trackingId,
      });

      setPurchasedProduct(product);
      setScreen("success");
      
      // Refresh logs list to show "converted" status
      await fetchLogs();
    } catch (err) {
      console.error("Purchase checkout failed", err);
      alert("Store checkout failed. Make sure CRM backend is running.");
    } finally {
      setPurchasing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Inbox Logs Left Column */}
      <div className="w-1/3 min-w-[340px] border-r border-zinc-900 bg-zinc-950/60 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-zinc-100">Shopper Devices</h1>
            <p className="text-xs text-zinc-550">Simulate receiver inbox & phone states</p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-zinc-200 transition-colors rounded-lg"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex-grow flex justify-center items-center">
            <RefreshCw className="h-6 w-6 text-zinc-650 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-zinc-900 border-dashed rounded-xl my-4 text-zinc-550">
            <Smartphone className="h-10 w-10 text-zinc-800 mb-3" />
            <span className="text-xs leading-relaxed">
              No messages dispatched yet. Go to campaigns and launch a campaign to populate shopper devices!
            </span>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {logs.map((log) => {
              const Icon = channelIcons[log.channel] || Smartphone;
              const isSelected = selectedLogId === log._id;
              
              return (
                <div
                  key={log._id}
                  onClick={() => handleSelectLog(log)}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-all duration-200 text-left",
                    isSelected
                      ? "bg-zinc-900 border-zinc-750"
                      : "bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-bold text-xs text-zinc-350 truncate">
                      {log.campaignId?.name || "One-off Message"}
                    </div>
                    <span className="text-[10px] text-zinc-550 font-mono">
                      {formatTime(log.createdAt)}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-zinc-150 mt-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    {log.customerId?.name}
                  </div>

                  <p className="text-xs text-zinc-500 truncate mt-2">"{log.messageText}"</p>

                  <div className="flex items-center gap-2 mt-4 text-[9px]">
                    <span className="bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-400 font-mono uppercase">
                      {log.channel}
                    </span>
                    <span className={cn(
                      "font-mono font-bold px-1.5 py-0.5 rounded-full uppercase ml-auto",
                      log.status === "converted" && "bg-emerald-950/30 text-emerald-450 border border-emerald-900/50",
                      log.status === "clicked" && "bg-violet-950/30 text-violet-450 border border-violet-900/50",
                      log.status === "read" && "bg-purple-950/30 text-purple-450 border border-purple-900/50",
                      log.status === "opened" && "bg-blue-950/30 text-blue-450 border border-blue-900/50",
                      log.status === "delivered" && "bg-zinc-900 text-zinc-350 border border-zinc-850",
                      log.status === "failed" && "bg-red-950/30 text-red-450 border border-red-950/50"
                    )}>
                      {log.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smartphone Mockup Column */}
      <div className="flex-grow flex items-center justify-center p-8 bg-zinc-950 relative overflow-y-auto">
        {selectedLog ? (
          <div className="flex flex-col items-center gap-6 max-w-md w-full py-6">
            <div className="text-center">
              <h3 className="text-sm font-bold text-zinc-300">Simulating Device: {selectedLog.customerId?.name}</h3>
              <p className="text-xs text-zinc-550 mt-1">Channel: <span className="uppercase font-semibold text-indigo-400">{selectedLog.channel}</span> | Status: <span className="capitalize">{selectedLog.status}</span></p>
            </div>

            {/* Premium iPhone style Mockup container */}
            <div className="w-[310px] h-[610px] rounded-[42px] bg-zinc-900 p-3 shadow-2xl border-4 border-zinc-800 relative flex flex-col shrink-0">
              {/* Speaker & Camera Notch */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-zinc-900 rounded-2xl z-25 flex items-center justify-center gap-1.5">
                <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                <div className="w-2 h-2 bg-zinc-850 rounded-full" />
              </div>

              {/* Internal Screen Frame */}
              <div className="flex-grow rounded-[32px] bg-zinc-950 border border-zinc-900 overflow-hidden flex flex-col relative select-none">
                {/* Device Status Bar */}
                <div className="h-9 px-6 flex justify-between items-center text-[10px] font-semibold text-zinc-400 bg-zinc-950 shrink-0 z-20">
                  <span className="font-mono">18:15</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-3 w-3" />
                    <Battery className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Smartphone Screens Handler */}
                {screen === "message" && (
                  /* Screen 1: Message app thread */
                  <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-zinc-900 bg-zinc-950 text-center shrink-0 flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-extrabold text-indigo-400 text-xs">
                        X
                      </div>
                      <span className="text-[10px] font-bold text-zinc-200 mt-1">Xeno Store Offer</span>
                      <span className="text-[8px] text-zinc-500 font-mono">
                        {selectedLog.channel === "email" ? selectedLog.customerId?.email : selectedLog.customerId?.phone}
                      </span>
                    </div>

                    {/* Chat Bubble Area */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-4 flex flex-col justify-end pb-6">
                      {selectedLog.channel === "email" ? (
                        /* Email view */
                        <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-3 text-[11px] text-zinc-350 space-y-2">
                          <div className="border-b border-zinc-950 pb-1.5 font-bold text-zinc-200">
                            Subject: Exclusive Rewards Program Update
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{selectedLog.messageText.split(" Click here to shop")[0]}</p>
                          <div
                            onClick={handleLinkClick}
                            className="inline-block w-full text-center py-2 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-white font-bold cursor-pointer transition-colors shadow-md mt-2 flex items-center justify-center gap-1"
                          >
                            <span>Shop Exclusive Offer</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      ) : (
                        /* Text/WhatsApp view */
                        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl rounded-tl-none p-3.5 text-[11px] text-zinc-300 leading-relaxed max-w-[85%] self-start relative shadow-md">
                          <p className="whitespace-pre-wrap">{selectedLog.messageText.split(" Click here to shop")[0]}</p>
                          
                          {/* Mock link click */}
                          <div
                            onClick={handleLinkClick}
                            className="text-indigo-400 underline mt-2 cursor-pointer font-semibold block break-all"
                          >
                            http://xeno.shop/click?t={selectedLog.trackingId.substring(0, 10)}...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {screen === "storefront" && (
                  /* Screen 2: Simulated store landing page */
                  <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden animate-slideUp">
                    {/* Store header */}
                    <div className="p-3.5 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center shrink-0">
                      <span className="text-[10px] font-bold tracking-widest text-zinc-300">XENO BOUTIQUE</span>
                      <ShoppingBag className="h-4 w-4 text-zinc-400" />
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      <div className="text-center pb-2 border-b border-zinc-900/50">
                        <span className="text-[10px] text-zinc-400">WELCOME,</span>
                        <h4 className="text-xs font-bold text-zinc-150 mt-0.5">{selectedLog.customerId?.name}</h4>
                        <p className="text-[9px] text-zinc-550 mt-1">Get exclusive products curated for you.</p>
                      </div>

                      <div className="space-y-3">
                        {products.map((p) => (
                          <div key={p.id} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center gap-3">
                            <span className="text-2xl shrink-0">{p.image}</span>
                            <div className="overflow-hidden">
                              <div className="text-[10px] font-bold text-zinc-200 truncate">{p.name}</div>
                              <span className="text-[9px] text-emerald-450 font-bold font-mono block mt-0.5">${p.price}</span>
                            </div>
                            <button
                              onClick={() => handleCheckout(p)}
                              disabled={purchasing}
                              className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold rounded-lg transition-colors shadow"
                            >
                              Buy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {screen === "success" && (
                  /* Screen 3: Purchase Success Receipt screen */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 animate-fadeIn">
                    <CheckCircle className="h-12 w-12 text-emerald-400 animate-bounce mb-4" />
                    
                    <h3 className="text-sm font-extrabold text-zinc-200">Purchase Completed!</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                      Thank you for buying the <strong className="text-zinc-350">{purchasedProduct?.name}</strong>.
                    </p>

                    <div className="bg-zinc-900/50 border border-zinc-900 p-3 rounded-lg text-[9px] font-mono text-zinc-400 mt-4 leading-relaxed w-full">
                      <div className="flex justify-between text-zinc-550 border-b border-zinc-950 pb-1 mb-1">
                        <span>Attribution status</span>
                        <strong className="text-emerald-400">CONVERTED</strong>
                      </div>
                      <div className="text-left mt-1">
                        Campaign conversion credited back to CRM database and statistics updated.
                      </div>
                    </div>

                    <button
                      onClick={() => setScreen("message")}
                      className="mt-6 flex items-center gap-1.5 px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to Inbox
                    </button>
                  </div>
                )}

                {/* iPhone Home Indicator bar */}
                <div className="h-5 bg-zinc-950 flex items-center justify-center shrink-0">
                  <div className="w-28 h-1 bg-zinc-800 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-550 p-8">
            <Smartphone className="h-14 w-14 text-zinc-800 mx-auto mb-3" />
            <h2 className="text-base font-bold text-zinc-300 font-sans">Smartphone Sandbox Simulator</h2>
            <p className="text-xs text-zinc-600 max-w-xs mt-1 leading-relaxed">
              Select an incoming shopper message from the left list to load the simulated phone interface, click links, and verify the checkout attribution loop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
