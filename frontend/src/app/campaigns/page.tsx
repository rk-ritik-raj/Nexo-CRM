"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Megaphone,
  Plus,
  Compass,
  MessageSquare,
  Mail,
  Smartphone,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Send,
  Eye,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const channelIcons: { [key: string]: any } = {
  whatsapp: MessageSquare,
  sms: Smartphone,
  email: Mail,
  rcs: Megaphone,
};

const channelColors: { [key: string]: string } = {
  whatsapp: "text-emerald-450 bg-emerald-950/20 border-emerald-900/50",
  sms: "text-blue-450 bg-blue-950/20 border-blue-900/50",
  email: "text-purple-450 bg-purple-950/20 border-purple-900/50",
  rcs: "text-amber-455 bg-amber-950/20 border-amber-900/50",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wizard toggle state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email" | "rcs">("whatsapp");
  const [messageTemplate, setMessageTemplate] = useState("Hi {name}, we have a special gift for you! Use code GIFT10 on your next purchase.");
  
  // AI Copywriter states
  const [aiOffer, setAiOffer] = useState("");
  const [aiTone, setAiTone] = useState("casual");
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [aiRationale, setAiRationale] = useState("");

  // Campaign Detail View state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch lists
  const fetchCampaignsAndSegments = async () => {
    try {
      setLoading(true);
      const campRes = await axios.get("http://localhost:5000/api/campaigns");
      const segRes = await axios.get("http://localhost:5000/api/segments");
      setCampaigns(campRes.data);
      setSegments(segRes.data);
    } catch (err) {
      console.error("Error loading campaigns page lists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndSegments();
  }, []);

  // Poll active campaign details if we are viewing one that is "sending"
  useEffect(() => {
    let interval: any;
    if (selectedCampaignId && campaignDetails?.campaign?.status === "sending") {
      interval = setInterval(() => {
        loadCampaignDetails(selectedCampaignId, false);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCampaignId, campaignDetails]);

  const loadCampaignDetails = async (id: string, showLoader = true) => {
    try {
      if (showLoader) setDetailLoading(true);
      const res = await axios.get(`http://localhost:5000/api/campaigns/${id}`);
      setCampaignDetails(res.data);
    } catch (err) {
      console.error("Error fetching campaign details", err);
    } finally {
      if (showLoader) setDetailLoading(false);
    }
  };

  const handleGenerateAICopy = async () => {
    if (!aiOffer.trim()) return;

    try {
      setGeneratingCopy(true);
      setError("");
      
      const segmentDesc = segments.find(s => s._id === selectedSegmentId)?.description || "our customer database";
      
      const res = await axios.post("http://localhost:5000/api/ai/generate-copy", {
        channel,
        segmentDescription: segmentDesc,
        offer: aiOffer,
        tone: aiTone,
      });

      if (res.data.messageTemplate) {
        setMessageTemplate(res.data.messageTemplate);
        setAiRationale(res.data.rationale || "");
      }
    } catch (err) {
      console.error("AI copy writer error", err);
      setError("AI Copy Generator failed. You can write the template manually.");
    } finally {
      setGeneratingCopy(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!name.trim()) return;

    try {
      setError("");
      const res = await axios.post("http://localhost:5000/api/campaigns", {
        name,
        description,
        segmentId: selectedSegmentId || null,
        channel,
        messageTemplate,
      });

      // Reset wizard
      setShowWizard(false);
      setName("");
      setDescription("");
      setSelectedSegmentId("");
      setChannel("whatsapp");
      setMessageTemplate("Hi {name}, we have a special gift for you! Use code GIFT10 on your next purchase.");
      setAiOffer("");
      setAiRationale("");
      setWizardStep(1);

      // Reload lists and select the new campaign
      await fetchCampaignsAndSegments();
      
      // Auto open detail view of the newly created draft
      setSelectedCampaignId(res.data._id);
      loadCampaignDetails(res.data._id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create campaign");
    }
  };

  const handleLaunchCampaign = async (id: string) => {
    try {
      setError("");
      await axios.post(`http://localhost:5000/api/campaigns/${id}/send`);
      
      // Load updated details immediately
      loadCampaignDetails(id);
      
      // Refresh list
      const campRes = await axios.get("http://localhost:5000/api/campaigns");
      setCampaigns(campRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to launch campaign");
    }
  };

  // Preview renderer substituting bracket variables
  const getRenderedPreview = () => {
    let text = messageTemplate;
    text = text.replace(/{name}/gi, "John Doe");
    text = text.replace(/{totalSpend}/gi, "$380.00");
    text = text.replace(/{lastPurchaseDate}/gi, "06/08/2026");
    text = text.replace(/{city}/gi, "Mumbai");
    return text + " Click here to shop: http://localhost:3000/sandbox?t=sample-token";
  };

  return (
    <div className="flex-grow flex h-screen overflow-hidden">
      {/* Sidebar List Column */}
      <div className="w-1/3 min-w-[340px] border-r border-zinc-900 bg-zinc-950/60 p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-zinc-100">Campaigns</h1>
            <p className="text-xs text-zinc-500">Run personalized message streams</p>
          </div>

          <button
            onClick={() => {
              setShowWizard(true);
              setWizardStep(1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <RefreshCw className="h-6 w-6 text-zinc-650 animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-zinc-900 border-dashed rounded-xl my-4 text-zinc-550">
            <Megaphone className="h-10 w-10 text-zinc-800 mb-3" />
            <span className="text-xs">No marketing campaigns run yet. Click "New" to start.</span>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto space-y-3 pr-1">
            {campaigns.map((camp) => {
              const Icon = channelIcons[camp.channel] || Megaphone;
              const isSelected = selectedCampaignId === camp._id;
              
              return (
                <div
                  key={camp._id}
                  onClick={() => {
                    setSelectedCampaignId(camp._id);
                    loadCampaignDetails(camp._id);
                  }}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-all duration-200",
                    isSelected
                      ? "bg-zinc-900 border-zinc-750"
                      : "bg-zinc-950/30 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-bold text-sm text-zinc-200 truncate">{camp.name}</div>
                    
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold border",
                      camp.status === "completed" && "bg-emerald-950/30 text-emerald-450 border-emerald-900",
                      camp.status === "sending" && "bg-blue-950/30 text-blue-450 border-blue-900 animate-pulse",
                      camp.status === "failed" && "bg-red-950/30 text-red-450 border-red-900",
                      camp.status === "draft" && "bg-zinc-900 text-zinc-450 border-zinc-800"
                    )}>
                      {camp.status}
                    </span>
                  </div>

                  {camp.description && (
                    <div className="text-xs text-zinc-500 truncate mt-1">{camp.description}</div>
                  )}

                  <div className="flex items-center gap-3 mt-4 text-[10px] text-zinc-500">
                    <div className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wide",
                      channelColors[camp.channel]
                    )}>
                      <Icon className="h-3 w-3" />
                      {camp.channel}
                    </div>

                    <span className="font-mono">
                      Sent: <strong className="text-zinc-350">{camp.sentCount}</strong>
                    </span>
                    
                    {camp.totalRevenueGenerated > 0 && (
                      <span className="text-emerald-400 font-bold ml-auto font-mono">
                        +${camp.totalRevenueGenerated.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Panel Content Column */}
      <div className="flex-1 bg-zinc-950 flex flex-col h-full relative overflow-y-auto">
        {showWizard ? (
          /* Wizard Creation Container */
          <div className="p-8 max-w-2xl mx-auto w-full py-12 space-y-8 animate-fadeIn">
            {/* Step indicators */}
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-550 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border font-bold",
                  wizardStep >= 1 ? "bg-indigo-600 text-white border-indigo-500" : "border-zinc-800"
                )}>1</span>
                <span className={wizardStep >= 1 ? "text-zinc-200" : ""}>Target & Details</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-700" />
              <div className="flex items-center gap-2">
                <span className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border font-bold",
                  wizardStep >= 2 ? "bg-indigo-600 text-white border-indigo-500" : "border-zinc-800"
                )}>2</span>
                <span className={wizardStep >= 2 ? "text-zinc-200" : ""}>Channel & Copy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-700" />
              <div className="flex items-center gap-2">
                <span className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border font-bold",
                  wizardStep >= 3 ? "bg-indigo-600 text-white border-indigo-500" : "border-zinc-800"
                )}>3</span>
                <span className={wizardStep >= 3 ? "text-zinc-200" : ""}>Review & Draft</span>
              </div>
            </div>

            {/* Form Steps */}
            {wizardStep === 1 && (
              <div className="space-y-5 animate-slideLeft">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-100">Describe your Campaign</h2>
                  <p className="text-xs text-zinc-500">Provide an internal reference and select your target audience segment.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Campaign Name</label>
                    <input
                      type="text"
                      placeholder="E.g., June VIP Loyalty discount"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-650"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Description</label>
                    <input
                      type="text"
                      placeholder="E.g., WhatsApp voucher for high spending customers"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-650"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Target Segment</label>
                    <select
                      value={selectedSegmentId}
                      onChange={(e) => setSelectedSegmentId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-650"
                    >
                      <option value="">All Customers (No segment filtering)</option>
                      {segments.map((seg) => (
                        <option key={seg._id} value={seg._id}>
                          {seg.name} ({seg.size} contact{seg.size === 1 ? "" : "s"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    disabled={!name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all ml-auto disabled:opacity-50"
                  >
                    Next Step
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-6 animate-slideLeft">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-100">Select Channel & Generate Copy</h2>
                  <p className="text-xs text-zinc-500">Pick how you want to reach shoppers and utilize our AI Copywriter Co-pilot.</p>
                </div>

                {/* Channel Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Delivery Channel</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["whatsapp", "sms", "email", "rcs"].map((ch) => {
                      const Icon = channelIcons[ch];
                      const isSelected = channel === ch;
                      return (
                        <div
                          key={ch}
                          onClick={() => setChannel(ch as any)}
                          className={cn(
                            "p-4 border rounded-xl flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-200 text-center font-bold text-sm",
                            isSelected
                              ? "bg-zinc-900 border-indigo-600 text-white shadow-lg shadow-indigo-600/5"
                              : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-850 hover:text-zinc-200"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", isSelected ? "text-indigo-400" : "text-zinc-500")} />
                          <span className="capitalize">{ch}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Copywriter Card */}
                <div className="p-5 bg-zinc-900/40 border border-indigo-950/40 rounded-xl space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl" />
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-zinc-200">AI Copywriter Co-Pilot</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-550 mb-1.5">What is the promo/offer?</label>
                      <input
                        type="text"
                        placeholder="E.g., 20% off all shoes code VIP20"
                        value={aiOffer}
                        onChange={(e) => setAiOffer(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-550 mb-1.5">Brand Voice / Tone</label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-350 focus:outline-none"
                      >
                        <option value="excited">Excited & Urgent</option>
                        <option value="casual">Friendly & Casual</option>
                        <option value="luxury">Elegant & Premium</option>
                        <option value="witty">Witty & Direct</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAICopy}
                    disabled={generatingCopy || !aiOffer.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {generatingCopy ? "Writing Copy..." : "Draft Personalized Copy"}
                  </button>

                  {aiRationale && (
                    <div className="text-[10px] text-zinc-400 bg-zinc-950/40 p-2.5 rounded border border-zinc-900 leading-relaxed">
                      <strong className="text-zinc-350">AI Rationale:</strong> {aiRationale}
                    </div>
                  )}
                </div>

                {/* Raw Template Input */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Message Template Editor</label>
                    <span className="text-[10px] text-zinc-550 font-mono">Use variables: &#123;name&#125;, &#123;totalSpend&#125;, &#123;lastPurchaseDate&#125;</span>
                  </div>
                  <textarea
                    rows={4}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-indigo-650 font-sans"
                  />
                </div>

                <div className="flex pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-lg transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    disabled={!messageTemplate.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all ml-auto disabled:opacity-50"
                  >
                    Next Step
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-6 animate-slideLeft">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-100">Review & Create</h2>
                  <p className="text-xs text-zinc-500">Confirm details and look at how a live shopper message will render.</p>
                </div>

                {/* Live rendering Mock Preview */}
                <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                    <Eye className="h-4 w-4 text-indigo-400" />
                    <span>Personalized Rendering Preview (John Doe)</span>
                  </div>
                  <div className="p-4 bg-zinc-900/35 border border-zinc-900 rounded-lg font-mono text-xs text-zinc-350 leading-relaxed break-words whitespace-pre-wrap select-none">
                    {getRenderedPreview()}
                  </div>
                </div>

                <div className="bg-zinc-900/10 border border-zinc-900 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between text-zinc-500">
                    <span>Campaign Name:</span>
                    <strong className="text-zinc-350">{name}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Channel:</span>
                    <strong className="text-indigo-400 uppercase tracking-wide">{channel}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Targeting Segment:</span>
                    <strong className="text-zinc-350">
                      {selectedSegmentId
                        ? segments.find((s) => s._id === selectedSegmentId)?.name
                        : "All Customers"}
                    </strong>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/20 border border-red-900 rounded-lg text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold rounded-lg transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all ml-auto"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Create Campaign Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : selectedCampaignId && campaignDetails ? (
          /* Campaign Details Panel */
          <div className="p-8 space-y-8 animate-fadeIn max-w-4xl mx-auto w-full">
            {/* Top row metadata */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase bg-indigo-950/20 border border-indigo-900/50 px-2 py-0.5 rounded">
                  {campaignDetails.campaign.channel} campaign
                </span>
                <h1 className="text-2xl font-extrabold text-zinc-100 mt-2">
                  {campaignDetails.campaign.name}
                </h1>
                {campaignDetails.campaign.description && (
                  <p className="text-xs text-zinc-400 mt-1">{campaignDetails.campaign.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {campaignDetails.campaign.status === "draft" && (
                  <button
                    onClick={() => handleLaunchCampaign(campaignDetails.campaign._id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/10"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Launch Campaign
                  </button>
                )}

                <button
                  onClick={() => loadCampaignDetails(campaignDetails.campaign._id)}
                  disabled={detailLoading}
                  className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-zinc-200 transition-colors"
                >
                  <RefreshCw className={cn("h-4 w-4", detailLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Sent / Targeted</span>
                <span className="text-2xl font-bold font-mono text-zinc-200 mt-1 block">
                  {campaignDetails.campaign.sentCount}
                </span>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Delivery Rate</span>
                <span className="text-2xl font-bold font-mono text-zinc-200 mt-1 block">
                  {campaignDetails.campaign.sentCount > 0
                    ? ((campaignDetails.campaign.deliveredCount / campaignDetails.campaign.sentCount) * 100).toFixed(0)
                    : 0}%
                </span>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  {campaignDetails.campaign.deliveredCount} delivered, {campaignDetails.campaign.failedCount} failed
                </span>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Conversions</span>
                <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
                  {campaignDetails.campaign.convertedCount}
                </span>
                <span className="text-[10px] text-zinc-550 mt-1 block">
                  Conversion Rate: {campaignDetails.campaign.sentCount > 0
                    ? ((campaignDetails.campaign.convertedCount / campaignDetails.campaign.sentCount) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl border-emerald-950/20 shadow-lg shadow-emerald-950/2">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Revenue Attributed</span>
                <span className="text-2xl font-black font-mono text-emerald-450 mt-1 block">
                  ${campaignDetails.campaign.totalRevenueGenerated?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Funnel visualization */}
            {campaignDetails.campaign.status !== "draft" && (
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-zinc-300">Campaign Engagement Funnel</h3>
                
                <div className="space-y-3.5">
                  {/* Delivered */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Delivered ({campaignDetails.campaign.deliveredCount})</span>
                      <span>
                        {campaignDetails.campaign.sentCount > 0
                          ? ((campaignDetails.campaign.deliveredCount / campaignDetails.campaign.sentCount) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            campaignDetails.campaign.sentCount > 0
                              ? (campaignDetails.campaign.deliveredCount / campaignDetails.campaign.sentCount) * 100
                              : 0
                          }%`,
                        }}
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Opened */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Opened ({campaignDetails.campaign.openedCount})</span>
                      <span>
                        {campaignDetails.campaign.sentCount > 0
                          ? ((campaignDetails.campaign.openedCount / campaignDetails.campaign.sentCount) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            campaignDetails.campaign.sentCount > 0
                              ? (campaignDetails.campaign.openedCount / campaignDetails.campaign.sentCount) * 100
                              : 0
                          }%`,
                        }}
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Clicked */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Clicked ({campaignDetails.campaign.clickedCount})</span>
                      <span>
                        {campaignDetails.campaign.sentCount > 0
                          ? ((campaignDetails.campaign.clickedCount / campaignDetails.campaign.sentCount) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            campaignDetails.campaign.sentCount > 0
                              ? (campaignDetails.campaign.clickedCount / campaignDetails.campaign.sentCount) * 100
                              : 0
                          }%`,
                        }}
                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Converted */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>Converted ({campaignDetails.campaign.convertedCount})</span>
                      <span>
                        {campaignDetails.campaign.sentCount > 0
                          ? ((campaignDetails.campaign.convertedCount / campaignDetails.campaign.sentCount) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${
                            campaignDetails.campaign.sentCount > 0
                              ? (campaignDetails.campaign.convertedCount / campaignDetails.campaign.sentCount) * 100
                              : 0
                          }%`,
                        }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logs list */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-zinc-900/30 border-b border-zinc-900">
                <h3 className="text-sm font-bold text-zinc-300">Message Logs / Recipient Timeline</h3>
              </div>

              {campaignDetails.logs?.length === 0 ? (
                <div className="p-8 text-center text-zinc-550 text-xs italic">
                  No logs found. Launch the campaign to dispatch messages.
                </div>
              ) : (
                <div className="divide-y divide-zinc-900/50 max-h-96 overflow-y-auto">
                  {campaignDetails.logs.map((log: any) => (
                    <div key={log._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                      <div>
                        <div className="font-bold text-zinc-250">
                          {log.customerId?.name || "Unknown"}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {log.customerId?.phone || log.customerId?.email}
                        </div>
                      </div>

                      <div className="p-2.5 bg-zinc-900/20 border border-zinc-900 rounded font-sans text-zinc-400 max-w-lg truncate leading-relaxed">
                        "{log.messageText}"
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider",
                          log.status === "converted" && "bg-emerald-950/20 text-emerald-450 border border-emerald-900/50",
                          log.status === "clicked" && "bg-violet-950/20 text-violet-450 border border-violet-900/50",
                          log.status === "read" && "bg-purple-950/20 text-purple-450 border border-purple-900/50",
                          log.status === "opened" && "bg-blue-950/20 text-blue-450 border border-blue-900/50",
                          log.status === "delivered" && "bg-zinc-900 text-zinc-300 border border-zinc-800",
                          log.status === "failed" && "bg-red-950/20 text-red-450 border border-red-900/50",
                          log.status === "sent" && "bg-zinc-900 text-zinc-500 border border-zinc-850"
                        )}>
                          {log.status}
                        </span>

                        {log.status === "failed" && log.errorMessage && (
                          <span className="text-[10px] text-red-500 italic max-w-xs truncate" title={log.errorMessage}>
                            ({log.errorMessage})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty Details Panel (Initial view) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <Megaphone className="h-14 w-14 text-zinc-800 mb-3.5" />
            <h2 className="text-base font-bold text-zinc-300">Select a Campaign</h2>
            <p className="text-xs text-zinc-550 max-w-xs mt-1">
              Click on any campaign in the sidebar list to inspect statistics, logs, and funnel progression, or build a new draft.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
