import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Hash, Volume2, ShieldAlert, Plus, Layers, Image as ImageIcon, Sparkles } from "lucide-react";
import { UITheme } from "../types";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeServerId: string;
  onCreateChannel: (chanData: { name: string; type: "text" | "voice"; description: string }) => void;
  onCreateServer: (serverData: { name: string; description: string; iconUrl: string }) => void;
  currentTheme: UITheme;
  defaultMode?: "channel" | "server";
}

export default function RoomModal({
  isOpen,
  onClose,
  activeServerId,
  onCreateChannel,
  onCreateServer,
  currentTheme,
  defaultMode = "channel",
}: RoomModalProps) {
  const [modalMode, setModalMode] = useState<"channel" | "server">(defaultMode);
  
  // Channel form states
  const [chanName, setChanName] = useState("");
  const [chanType, setChanType] = useState<"text" | "voice">("text");
  const [chanDesc, setChanDesc] = useState("");
  
  // Server form states
  const [serverName, setServerName] = useState("");
  const [serverDesc, setServerDesc] = useState("");
  const [serverIcon, setServerIcon] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  // Sync mode state upon opening
  useEffect(() => {
    if (isOpen) {
      setModalMode(defaultMode);
      setErrorMsg("");
    }
  }, [isOpen, defaultMode]);

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    let normalizedName = chanName.trim();
    if (chanType === "text") {
      normalizedName = normalizedName.toLowerCase().replace(/[^a-z0-9\-]/g, "-");
    }

    if (!normalizedName) {
      setErrorMsg("Please provide a valid name.");
      return;
    }

    onCreateChannel({
      name: normalizedName,
      type: chanType,
      description: chanDesc.trim(),
    });

    setChanName("");
    setChanDesc("");
    onClose();
  };

  const handleServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!serverName.trim()) {
      setErrorMsg("Server group name is required.");
      return;
    }

    onCreateServer({
      name: serverName.trim(),
      description: serverDesc.trim(),
      iconUrl: serverIcon.trim(),
    });

    setServerName("");
    setServerDesc("");
    setServerIcon("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop glass blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl border bg-slate-900 text-slate-100 shadow-2xl p-6 ${
              currentTheme === "cyberpunk-neon" 
                ? "border-fuchsia-500 shadow-[0_0_20px_rgba(255,0,127,0.35)]" 
                : "border-slate-800"
            }`}
          >
            {/* Close trigger button */}
            <div className="absolute right-4 top-4">
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Wizard Tabs selection */}
            <div className="flex border-b border-slate-800 pb-3 mb-5 gap-4">
              <button
                type="button"
                onClick={() => {
                  setModalMode("channel");
                  setErrorMsg("");
                }}
                className={`pb-1 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                  modalMode === "channel"
                    ? "border-teal-400 text-teal-400 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Channel
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode("server");
                  setErrorMsg("");
                }}
                className={`pb-1 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
                  modalMode === "server"
                    ? "border-teal-400 text-teal-400 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Server Group
              </button>
            </div>

            {/* Error alerts banner container */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-2xs text-red-300">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <p>{errorMsg}</p>
              </div>
            )}

            {modalMode === "channel" ? (
              /* CHANNEL BUILDER FORM PANEL */
              <form onSubmit={handleChannelSubmit} className="space-y-4">
                
                <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Add Channel</h3>
                    <p className="text-4xs text-slate-400 leading-normal">
                      Build standard text logs or interactive real Web Audio voice streams.
                    </p>
                  </div>
                </div>

                {/* Channel Type Selector */}
                <div>
                  <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Channel Type format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    
                    <button
                      type="button"
                      onClick={() => setChanType("text")}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition ${
                        chanType === "text"
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 font-semibold"
                          : "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <Hash className="h-4.5 w-4.5" />
                      <div className="flex flex-col text-left">
                        <span className="text-3xs">Text Room</span>
                        <span className="text-5xs text-slate-500">Post messages, images</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChanType("voice")}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition ${
                        chanType === "voice"
                          ? "bg-emerald-500/10 border-emerald-400 text-emerald-400 font-semibold"
                          : "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <Volume2 className="h-4.5 w-4.5" />
                      <div className="flex flex-col text-left">
                        <span className="text-3xs">Voice Call</span>
                        <span className="text-5xs text-slate-500">Speaking signal ripples</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Channel Name */}
                <div>
                  <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Channel Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                      {chanType === "text" ? <Hash className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </span>
                    <input
                      type="text"
                      required
                      value={chanName}
                      onChange={(e) => {
                        const val = chanType === "text" 
                          ? e.target.value.toLowerCase().replace(/\s+/g, "-") 
                          : e.target.value;
                        setChanName(val);
                      }}
                      placeholder={chanType === "text" ? "e.g. gaming-tactics" : "e.g. Squad Comm Lobby"}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:border-teal-400 outline-hidden focus:ring-1 focus:ring-teal-400"
                    />
                  </div>
                </div>

                {/* Channel Description */}
                <div>
                  <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={chanDesc}
                    onChange={(e) => setChanDesc(e.target.value)}
                    placeholder="Short summary describing the group chatter"
                    rows={2}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-650 focus:border-teal-400 outline-hidden resize-none"
                  />
                </div>

                {/* Foot Submission buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-slate-800 hover:bg-slate-705 px-4.5 py-2 text-2xs font-semibold text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl px-4.5 py-2 text-2xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition"
                  >
                    Create Channel
                  </button>
                </div>

              </form>
            ) : (
              /* SERVER GUILD BUILDER FORM PANEL */
              <form onSubmit={handleServerSubmit} className="space-y-4">
                
                <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Create Server Group</h3>
                    <p className="text-4xs text-slate-400 leading-normal">
                      Start an independent guild with private channels, forums, DMs, and live voice calls.
                    </p>
                  </div>
                </div>

                {/* Server Name */}
                <div>
                  <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Server Name
                  </label>
                  <input
                    type="text"
                    required
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="e.g. Satoshi Developers Tavern"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 focus:border-teal-400 outline-hidden"
                  />
                </div>

                {/* Server Icon Url */}
                <div>
                  <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Server Icon Image URL <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      value={serverIcon}
                      onChange={(e) => setServerIcon(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-650 focus:border-teal-400 outline-hidden"
                    />
                  </div>
                </div>

                {/* Server Description */}
                <div>
                  <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Server Description
                  </label>
                  <textarea
                    value={serverDesc}
                    onChange={(e) => setServerDesc(e.target.value)}
                    placeholder="Briefly tell new members what this server group is about"
                    rows={2}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-650 focus:border-teal-400 outline-hidden resize-none"
                  />
                </div>

                {/* Foot Submission buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-slate-800 hover:bg-slate-705 px-4.5 py-2 text-2xs font-semibold text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl px-4.5 py-2 text-2xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition"
                  >
                    Create Server
                  </button>
                </div>

              </form>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
