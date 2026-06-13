"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Layers,
  Sparkles,
  Users,
  Plus,
  Trash2,
  Play,
  Save,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  field: string;
  operator: string;
  value: any;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New segment states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<Rule[]>([
    { field: "totalSpend", operator: "gt", value: 100 },
  ]);

  // AI translator states
  const [aiPrompt, setAiPrompt] = useState("");
  const [translating, setTranslating] = useState(false);

  // Preview states
  const [previewing, setPreviewing] = useState(false);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([]);
  const [error, setError] = useState("");

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/segments");
      setSegments(res.data);
    } catch (err) {
      console.error("Error fetching segments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleAddRule = () => {
    setRules([...rules, { field: "totalSpend", operator: "gt", value: 0 }]);
  };

  const handleRemoveRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
  };

  const handleRuleChange = (index: number, key: keyof Rule, val: any) => {
    const updated = [...rules];
    
    // Set default operator if field changes
    if (key === "field") {
      updated[index].field = val;
      if (val === "totalSpend") {
        updated[index].operator = "gt";
        updated[index].value = 100;
      } else if (val === "lastPurchaseDate") {
        updated[index].operator = "lt_days_ago";
        updated[index].value = 30;
      } else {
        updated[index].operator = "eq";
        updated[index].value = "";
      }
    } else {
      updated[index][key] = val as any;
    }

    setRules(updated);
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      setError("");
      const res = await axios.post("http://localhost:5000/api/segments/preview", {
        rules,
      });
      setPreviewSize(res.data.size);
      setPreviewCustomers(res.data.customers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to preview segment");
    } finally {
      setPreviewing(false);
    }
  };

  const handleTranslateAI = async () => {
    if (!aiPrompt.trim()) return;

    try {
      setTranslating(true);
      setError("");
      const res = await axios.post("http://localhost:5000/api/ai/translate-segment", {
        prompt: aiPrompt,
      });

      if (res.data.rules && Array.isArray(res.data.rules)) {
        setRules(res.data.rules);
        setDescription(res.data.explanation || "");
        
        // Auto-run preview for user feedback
        const previewRes = await axios.post("http://localhost:5000/api/segments/preview", {
          rules: res.data.rules,
        });
        setPreviewSize(previewRes.data.size);
        setPreviewCustomers(previewRes.data.customers);
      }
    } catch (err: any) {
      console.error("AI translation error", err);
      setError("AI Translation failed. Using standard rule builder fallback.");
    } finally {
      setTranslating(false);
    }
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Segment name is required");
      return;
    }

    try {
      setError("");
      await axios.post("http://localhost:5000/api/segments", {
        name,
        description,
        rules,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setRules([{ field: "totalSpend", operator: "gt", value: 100 }]);
      setPreviewSize(null);
      setPreviewCustomers([]);
      
      // Refresh list
      fetchSegments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create segment");
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/segments/${id}`);
      fetchSegments();
    } catch (err) {
      console.error("Error deleting segment", err);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Segment Builder Column */}
      <div className="xl:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Segment Builder
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Group customers based on spending, behavior, or location using filters or AI.
          </p>
        </div>

        {/* AI Co-Pilot Input */}
        <div className="p-5 bg-zinc-900/40 border border-indigo-950/40 rounded-xl space-y-3 shadow-lg shadow-indigo-950/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-200">AI Segment Co-Pilot</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Describe the segment in plain language (e.g. "customers who spent more than 500 dollars and live in Delhi"):
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="E.g., Shoppers in London with a total spend above $200"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-650 transition-colors"
            />
            <button
              type="button"
              onClick={handleTranslateAI}
              disabled={translating || !aiPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-md shadow-indigo-600/15 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {translating ? "Translating..." : "Translate"}
            </button>
          </div>
        </div>

        {/* Form builder */}
        <form onSubmit={handleSaveSegment} className="space-y-5 bg-zinc-950/40 border border-zinc-900 p-6 rounded-xl relative shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Segment Name</label>
              <input
                type="text"
                placeholder="E.g., Premium Delhi Customers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-650 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Description / Context</label>
              <input
                type="text"
                placeholder="Brief summary of targeting goal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-650 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Targeting Rules</label>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Condition
              </button>
            </div>

            <div className="space-y-2.5">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-2 bg-zinc-900/20 border border-zinc-900/60 p-3 rounded-lg items-center relative group"
                >
                  <select
                    value={rule.field}
                    onChange={(e) => handleRuleChange(idx, "field", e.target.value)}
                    className="w-full sm:w-1/4 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-650"
                  >
                    <option value="totalSpend">Total Spend ($)</option>
                    <option value="lastPurchaseDate">Days Inactive</option>
                    <option value="city">City</option>
                    <option value="name">Customer Name</option>
                  </select>

                  {/* Operator dropdown conditional on field type */}
                  <select
                    value={rule.operator}
                    onChange={(e) => handleRuleChange(idx, "operator", e.target.value)}
                    className="w-full sm:w-1/4 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-650"
                  >
                    {rule.field === "totalSpend" && (
                      <>
                        <option value="gt">Greater Than (&gt;)</option>
                        <option value="lt">Less Than (&lt;)</option>
                        <option value="eq">Equal To (=)</option>
                      </>
                    )}
                    {rule.field === "lastPurchaseDate" && (
                      <>
                        <option value="lt_days_ago">Older than (Days Inactive &gt;)</option>
                        <option value="gt_days_ago">Within last (Days Inactive &lt;=)</option>
                      </>
                    )}
                    {(rule.field === "city" || rule.field === "name") && (
                      <>
                        <option value="eq">Is Exactly</option>
                        <option value="contains">Contains (Partial)</option>
                      </>
                    )}
                  </select>

                  {/* Value input based on field */}
                  <input
                    type={rule.field === "totalSpend" || rule.field === "lastPurchaseDate" ? "number" : "text"}
                    placeholder="Enter threshold/value"
                    value={rule.value}
                    onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                    className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-650"
                  />

                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900 rounded-lg flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="flex items-center gap-1.5 px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold rounded-lg transition-all duration-200"
            >
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              {previewing ? "Evaluating..." : "Evaluate Size & Preview"}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all duration-200 ml-auto"
            >
              <Save className="h-3.5 w-3.5" />
              Save Segment
            </button>
          </div>
        </form>

        {/* Live Preview List */}
        {previewSize !== null && (
          <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-200">Segment Preview Size</h3>
              </div>
              <span className="text-xs bg-indigo-950/50 border border-indigo-900 text-indigo-300 px-3 py-1 rounded-full font-bold">
                {previewSize} matching shopper{previewSize === 1 ? "" : "s"}
              </span>
            </div>

            {previewCustomers.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-zinc-900 rounded-lg divide-y divide-zinc-900/40">
                {previewCustomers.map((cust) => (
                  <div key={cust._id} className="p-3 text-xs flex justify-between items-center hover:bg-zinc-900/10">
                    <div>
                      <span className="font-semibold text-zinc-200">{cust.name}</span>
                      <span className="text-zinc-550 ml-2 font-mono">{cust.email}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-400"><MapPin className="h-3 w-3 inline mr-1 text-zinc-500" />{cust.city}</span>
                      <span className="font-bold text-emerald-400 font-mono">${cust.totalSpend} spend</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic p-2 text-center bg-zinc-900/10 rounded-lg">
                No shoppers match the chosen conditions.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Segments Saved List Column */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-200">Saved Segments</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Active definitions synced to campaign launchpad.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <RefreshCw className="h-6 w-6 text-zinc-650 animate-spin" />
          </div>
        ) : segments.length === 0 ? (
          <div className="p-8 border border-zinc-900 border-dashed rounded-xl text-center text-zinc-500">
            <Layers className="h-8 w-8 mx-auto text-zinc-700 mb-2" />
            <span className="text-xs">No custom segments created yet. Use the Segment Builder to save one!</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {segments.map((seg) => (
              <div
                key={seg._id}
                className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all duration-200 flex justify-between items-start gap-4 group"
              >
                <div className="overflow-hidden">
                  <div className="font-bold text-zinc-200 text-sm truncate">{seg.name}</div>
                  {seg.description && (
                    <div className="text-xs text-zinc-400 truncate mt-0.5">{seg.description}</div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-500">
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 font-mono text-indigo-400 font-semibold">
                      {seg.size} Shopper{seg.size === 1 ? "" : "s"}
                    </span>
                    <span className="font-mono">Created {new Date(seg.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSegment(seg._id)}
                  className="text-zinc-650 hover:text-red-400 p-1 rounded hover:bg-red-950/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
