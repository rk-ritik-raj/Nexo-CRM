"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Send,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Coins,
  Bot,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    customersCount: 0,
    campaignsCount: 0,
    ordersCount: 0,
    totalSpend: 0,
    totalRevenue: 0,
    conversionRate: 0,
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    clickedCount: 0,
    convertedCount: 0,
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Co-Pilot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your Xeno AI Co-Pilot. I can help you analyze customer segments, brainstorm campaign copy, or suggest marketing optimization ideas. Ask me anything!",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const custRes = await axios.get("http://localhost:5000/api/customers");
      const campRes = await axios.get("http://localhost:5000/api/campaigns");
      const orderRes = await axios.get("http://localhost:5000/api/orders");

      const customers = custRes.data;
      const camps = campRes.data;
      const orders = orderRes.data;

      setCampaigns(camps);

      // Aggregate statistics
      const totalSpend = customers.reduce((sum: number, c: any) => sum + (c.totalSpend || 0), 0);
      
      let sentCount = 0;
      let deliveredCount = 0;
      let openedCount = 0;
      let clickedCount = 0;
      let convertedCount = 0;
      let totalRevenue = 0;

      camps.forEach((c: any) => {
        sentCount += c.sentCount || 0;
        deliveredCount += c.deliveredCount || 0;
        openedCount += c.openedCount || 0;
        clickedCount += c.clickedCount || 0;
        convertedCount += c.convertedCount || 0;
        totalRevenue += c.totalRevenueGenerated || 0;
      });

      const conversionRate = sentCount > 0 ? (convertedCount / sentCount) * 100 : 0;

      setStats({
        customersCount: customers.length,
        campaignsCount: camps.length,
        ordersCount: orders.length,
        totalSpend,
        totalRevenue,
        conversionRate,
        sentCount,
        deliveredCount,
        openedCount,
        clickedCount,
        convertedCount,
      });
    } catch (err) {
      console.error("Error loading dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSendChat = async (messageText?: string) => {
    const textToSend = messageText || chatInput;
    if (!textToSend.trim()) return;

    const newHistory = [...chatHistory, { role: "user", content: textToSend }];
    setChatHistory(newHistory);
    if (!messageText) setChatInput("");
    setChatLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/ai/copilot-chat", {
        message: textToSend,
        chatHistory: newHistory,
      });

      setChatHistory([
        ...newHistory,
        { role: "assistant", content: res.data.text || "I apologize, I could not process that message." },
      ]);
    } catch (err) {
      console.error("AI Co-pilot chat error", err);
      setChatHistory([
        ...newHistory,
        {
          role: "assistant",
          content:
            "Hello! I am currently running offline. Please verify that the backend server is running and the Gemini API key is configured properly in `.env`.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const samplePrompts = [
    "Suggest a WhatsApp offer for low spenders",
    "How can I target inactive Delhi customers?",
    "Show campaign performance summary",
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto relative h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Executive Cockpit
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time analytics and shopper communication performance insights.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-zinc-200 transition-all duration-200 shadow"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading && stats.customersCount === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Shoppers Card */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl relative shadow-lg shadow-black/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-xl rounded-full" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Shoppers Ledger</span>
                <Users className="h-4.5 w-4.5 text-zinc-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-zinc-100 mt-3">{stats.customersCount}</div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-450" />
                Active mock profiles in database
              </p>
            </div>

            {/* Campaigns Card */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl relative shadow-lg shadow-black/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-xl rounded-full" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Campaigns Launched</span>
                <Megaphone className="h-4.5 w-4.5 text-zinc-600" />
              </div>
              <div className="text-3xl font-bold font-mono text-zinc-100 mt-3">{stats.campaignsCount}</div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                <span>{stats.sentCount} total messages dispatched</span>
              </p>
            </div>

            {/* Conversions Card */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl relative shadow-lg shadow-black/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-xl rounded-full" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Conversion Rate</span>
                <Bot className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-indigo-400 mt-3">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-[10px] text-zinc-500 mt-2">
                {stats.convertedCount} attributed checkout orders
              </p>
            </div>

            {/* Revenue Card */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl relative border-emerald-950/20 shadow-lg shadow-emerald-950/2 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-xl rounded-full" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-emerald-550 font-bold uppercase tracking-wider">CRM Attributed Revenue</span>
                <Coins className="h-4.5 w-4.5 text-emerald-550" />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-450 mt-3">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                <Coins className="h-3 w-3 text-emerald-500" />
                Of ${stats.totalSpend.toFixed(0)} aggregate shopper spend
              </p>
            </div>
          </div>

          {/* Charts & Funnels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conversion Funnel Breakdown */}
            <div className="lg:col-span-2 p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Global Customer Engagement Funnel</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Aggregated metrics across all channels.</p>
              </div>

              {stats.sentCount === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-zinc-550 border border-zinc-900 border-dashed rounded-xl italic">
                  No campaigns dispatched yet. Launch a campaign to see the conversion pipeline.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sent */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="font-semibold">Messages Dispatched</span>
                      <span className="font-mono text-zinc-350">{stats.sentCount}</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-400 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Delivered */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="font-semibold">Delivered ({stats.deliveredCount})</span>
                      <span className="font-mono text-zinc-350">{((stats.deliveredCount / stats.sentCount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(stats.deliveredCount / stats.sentCount) * 100}%` }}
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Opened */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="font-semibold">Opened ({stats.openedCount})</span>
                      <span className="font-mono text-zinc-350">{((stats.openedCount / stats.sentCount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(stats.openedCount / stats.sentCount) * 100}%` }}
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Clicked */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="font-semibold">Clicked ({stats.clickedCount})</span>
                      <span className="font-mono text-zinc-350">{((stats.clickedCount / stats.sentCount) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(stats.clickedCount / stats.sentCount) * 100}%` }}
                        className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Converted */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                      <span className="font-semibold text-emerald-450 flex items-center gap-1">
                        Converted / Purchased ({stats.convertedCount})
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">{stats.conversionRate.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${stats.conversionRate}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Ledger preview */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Recent Campaigns</h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-sans">Latest launches in the CRM.</p>
              </div>

              {campaigns.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-zinc-550 border border-zinc-900 border-dashed rounded-xl italic">
                  No campaigns found.
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.slice(0, 4).map((c) => (
                    <div key={c._id} className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-zinc-200 truncate max-w-[140px]">{c.name}</div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5 block">{c.channel}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold font-mono">+${c.totalRevenueGenerated || 0}</span>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{c.convertedCount} conversions</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Campaign Co-Pilot chat interface widget */}
      <div className="fixed bottom-6 right-6 z-40">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/35 border border-indigo-500/30 transition-transform duration-200 hover:scale-105 active:scale-95 animate-bounce"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        ) : (
          <div className="w-[360px] h-[480px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Xeno AI Co-Pilot</h4>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>

              <button
                onClick={() => setChatOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
              {chatHistory.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl p-3 leading-relaxed",
                    h.role === "user"
                      ? "bg-indigo-650 text-white self-end rounded-tr-none"
                      : "bg-zinc-900 text-zinc-350 self-start rounded-tl-none border border-zinc-850"
                  )}
                >
                  <p className="whitespace-pre-wrap">{h.content}</p>
                </div>
              ))}
              
              {chatLoading && (
                <div className="p-3 bg-zinc-900 text-zinc-350 self-start rounded-2xl rounded-tl-none border border-zinc-850 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                  <span>Typing co-pilot ideas...</span>
                </div>
              )}
            </div>

            {/* Suggestion tags */}
            {chatHistory.length === 1 && (
              <div className="px-4 py-2 flex flex-col gap-1.5 shrink-0 border-t border-zinc-900/50 bg-zinc-950">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Quick Prompts</span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(p)}
                    className="p-2 bg-zinc-900 hover:bg-zinc-850 text-left rounded-lg text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-900"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-zinc-900 bg-zinc-950 shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Ask Co-Pilot..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-650"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
