import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Hash,
  Plus,
  Compass,
  Volume2,
  Mic,
  MicOff,
  Headphones,
  LogOut,
  PlusCircle,
  Sparkles,
  PhoneOff,
  UserCheck,
  Search,
  MessageSquare,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { User as ChatUser, ServerGroup, Channel, UITheme } from "../types";

interface SidebarProps {
  currentUser: ChatUser;
  servers: ServerGroup[];
  channels: Channel[];
  users: ChatUser[];
  activeServerId: string;
  activeChannelId: string;
  onServerSelect: (serverId: string) => void;
  onChannelSelect: (channelId: string) => void;
  onOpenCreateServer: () => void;
  onOpenCreateChannel: () => void;
  onLogout: () => void;
  unreadCounts: Record<string, number>;
  activeVoiceChannelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnectVoice: () => void;
  currentTheme: UITheme;
  onChangeTheme: (theme: UITheme) => void;
}

export default function Sidebar({
  currentUser,
  servers,
  channels,
  users,
  activeServerId,
  activeChannelId,
  onServerSelect,
  onChannelSelect,
  onOpenCreateServer,
  onOpenCreateChannel,
  onLogout,
  unreadCounts,
  activeVoiceChannelId,
  isMuted,
  isDeafened,
  onDisconnectVoice,
  onToggleMute,
  onToggleDeafen,
  currentTheme,
  onChangeTheme,
}: SidebarProps) {
  const [userSearchText, setUserSearchText] = useState("");

  // Determine theme styling classes
  const getThemeClasses = () => {
    switch (currentTheme) {
      case "cyberpunk-neon":
        return {
          railBg: "bg-[#0c0016] border-fuchsia-900/30",
          middleBg: "bg-[#05000a] text-[#00ffcc]",
          textMuted: "text-slate-400",
          textActive: "text-[#ff007f]",
          itemActive: "bg-fuchsia-950/40 text-[#ff007f] border-[#ff007f]",
          itemHover: "hover:bg-slate-900 text-slate-300",
          footerBg: "bg-[#06000c] border-[#ff007f]/20",
          badgeBg: "bg-[#ff007f] text-white",
        };
      case "minimalist-light":
        return {
          railBg: "bg-[#e3e5e8] border-slate-300",
          middleBg: "bg-[#f2f3f5] text-slate-800",
          textMuted: "text-slate-500",
          textActive: "text-teal-600",
          itemActive: "bg-[#e3e5e8] text-slate-900 border-teal-600 font-semibold",
          itemHover: "hover:bg-[#e3e5e8]/50 text-slate-700",
          footerBg: "bg-[#ebedf0] border-slate-300",
          badgeBg: "bg-teal-600 text-white",
        };
      case "forest-sage":
        return {
          railBg: "bg-[#121c17] border-emerald-950/40",
          middleBg: "bg-[#1a2620] text-emerald-300",
          textMuted: "text-emerald-500/80",
          textActive: "text-emerald-400",
          itemActive: "bg-emerald-950/50 text-emerald-300 border-emerald-400",
          itemHover: "hover:bg-emerald-900/30 text-emerald-400",
          footerBg: "bg-[#17221c] border-emerald-905",
          badgeBg: "bg-emerald-500 text-slate-950",
        };
      case "discord-midnight":
      default:
        return {
          railBg: "bg-[#1e1f22] border-slate-900",
          middleBg: "bg-[#2b2d31] text-slate-200",
          textMuted: "text-slate-400",
          textActive: "text-slate-100",
          itemActive: "bg-[#35373c] text-slate-100 border-indigo-500 font-medium",
          itemHover: "hover:bg-[#35373c]/65 text-slate-300",
          footerBg: "bg-[#232428] border-slate-900",
          badgeBg: "bg-[#5865f2] text-white",
        };
    }
  };

  const style = getThemeClasses();

  // Helper to generate deterministic PM roomId
  const getPrivateRoomId = (otherUserId: string) => {
    return currentUser.id < otherUserId
      ? `private-${currentUser.id}-${otherUserId}`
      : `private-${otherUserId}-${currentUser.id}`;
  };

  // Filter out the logged-in user for PM listings
  const eligibleDMusers = users.filter((u) => u.id !== currentUser.id);

  // Filter channels based on active server
  const activeServerChannels = channels.filter((c) => c.serverId === activeServerId);
  const textChannels = activeServerChannels.filter((c) => c.type === "text");
  const voiceChannels = activeServerChannels.filter((c) => c.type === "voice");

  // Filter DM directory list based on local text search
  const filteredUsers = eligibleDMusers.filter((u) =>
    u.username.toLowerCase().includes(userSearchText.toLowerCase())
  );

  const selectedServer = servers.find((s) => s.id === activeServerId);
  const activeVoiceChannel = channels.find((c) => c.id === activeVoiceChannelId);

  // Count active speakers in active voice channel
  const speakersInVoice = users.filter((u) => u.currentVoiceChannelId === activeVoiceChannelId);

  return (
    <div className="flex h-full w-full select-none text-sm font-sans">
      
      {/* 1. DISCORD LEFTMOST RAIL: GUILDS SERVER ICONS (~72px width) */}
      <div className={`w-18 shrink-0 flex flex-col items-center py-3 gap-2 border-r z-20 ${style.railBg}`}>
        
        {/* Discord dynamic Home / Direct Chats round Icon */}
        <div className="relative group">
          <button
            onClick={() => onServerSelect("home")}
            className={`w-12 h-12 rounded-3xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
              activeServerId === "home"
                ? "rounded-2xl bg-indigo-500 text-white"
                : "bg-slate-800 hover:rounded-2xl hover:bg-indigo-500 hover:text-white text-slate-200"
            }`}
          >
            <Compass className="h-5 w-5" />
          </button>
          
          {/* Active white left pillar slide widget */}
          {activeServerId === "home" && (
            <span className="absolute left-0 top-3 h-6 w-1 rounded-r-lg bg-indigo-500" />
          )}

          {/* Discord Tooltips hover hint */}
          <div className="absolute left-16 top-3 bg-slate-950 font-sans text-2xs z-30 font-semibold px-2 py-1 rounded shadow-md hidden group-hover:block whitespace-nowrap text-white">
            Direct Messages
          </div>
        </div>

        {/* Divider item */}
        <span className="w-8 h-[2px] bg-slate-800 rounded my-1.5" />

        {/* Dynamic Registered group servers map */}
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-2 scrollbar-none">
          {servers.map((srv) => {
            const isActive = srv.id === activeServerId;
            const initials = srv.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .substring(0, 3)
              .toUpperCase();

            return (
              <div key={srv.id} className="relative group">
                <button
                  onClick={() => onServerSelect(srv.id)}
                  className={`w-12 h-12 rounded-3xl flex items-center justify-center transition-all duration-300 overflow-hidden text-xs font-bold ${
                    isActive
                      ? "rounded-2xl bg-teal-500 text-slate-950"
                      : "bg-slate-800 hover:rounded-2xl hover:bg-teal-400 hover:text-slate-950 text-slate-300"
                  }`}
                >
                  {srv.iconUrl ? (
                    <img
                      src={srv.iconUrl}
                      alt={srv.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </button>

                {isActive && (
                  <span className="absolute left-0 top-3.5 h-5 w-1 rounded-r-lg bg-teal-400" />
                )}

                <div className="absolute left-16 top-3 bg-slate-950 font-sans text-2xs z-30 font-semibold px-2.5 py-1 rounded shadow-md hidden group-hover:block whitespace-nowrap text-white border border-slate-800/80">
                  {srv.name}
                </div>
              </div>
            );
          })}

          {/* Create new Server Guild Action button */}
          <div className="relative group mt-1">
            <button
              onClick={onOpenCreateServer}
              className="w-12 h-12 rounded-3xl bg-slate-800 flex items-center justify-center text-emerald-400 transition-all duration-300 hover:rounded-2xl hover:bg-emerald-500 hover:text-slate-950"
              title="Add a dynamic server / group Guild"
            >
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </button>
            <div className="absolute left-16 top-3 bg-slate-950 font-sans text-2xs z-30 font-semibold px-2 py-1 rounded shadow-md hidden group-hover:block whitespace-nowrap text-white">
              Create a Server
            </div>
          </div>
        </div>

        {/* Discord UI Theme option selector trigger */}
        <div className="relative group pt-4 border-t border-slate-850 w-full flex flex-col items-center gap-2">
          
          <span className="text-4xs text-slate-500 tracking-wider font-extrabold uppercase mb-1">
            Presets
          </span>

          {/* Mini selectable round color nodes */}
          <button
            onClick={() => onChangeTheme("discord-midnight")}
            className={`w-6 h-6 rounded-full bg-[#5865f2] border-2 transition ${
              currentTheme === "discord-midnight" ? "border-white scale-110" : "border-transparent hover:scale-105"
            }`}
            title="Discord Midnight"
          />

          <button
            onClick={() => onChangeTheme("cyberpunk-neon")}
            className={`w-6 h-6 rounded-full bg-[#ff007f] border-2 transition ${
              currentTheme === "cyberpunk-neon" ? "border-[#00ffcc] scale-110" : "border-transparent hover:scale-105"
            }`}
            title="Cyberpunk Neon"
          />

          <button
            onClick={() => onChangeTheme("minimalist-light")}
            className={`w-6 h-6 rounded-full bg-[#8a99ad] border-2 transition ${
              currentTheme === "minimalist-light" ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"
            }`}
            title="Minimalist Light"
          />

          <button
            onClick={() => onChangeTheme("forest-sage")}
            className={`w-6 h-6 rounded-full bg-emerald-700 border-2 transition ${
              currentTheme === "forest-sage" ? "border-emerald-300 scale-110" : "border-transparent hover:scale-105"
            }`}
            title="Forest Sage"
          />
        </div>

      </div>

      {/* 2. DISCORD MIDDLE COLUMN: SERVER CHANNELS LIST (~230px width) */}
      <div className={`w-58 shrink-0 flex flex-col h-full scrollbar-none select-none z-10 ${style.middleBg}`}>
        
        {/* Dynamic header title depending on Server Select */}
        <div className="flex h-12 px-3.5 items-center justify-between border-b border-black/35 shadow-3xs">
          <span className="font-bold tracking-tight truncate max-w-[80%]">
            {activeServerId === "home" ? "Direct Home Feed" : selectedServer?.name}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition ${style.textMuted}`} />
        </div>

        {/* Directory Content List */}
        <div className="flex-1 overflow-y-auto px-2 py-3.5 space-y-5">
          
          {activeServerId === "home" ? (
            /* HOME (DIRECT MESSAGES DIRECTORY) LISTING */
            <div className="space-y-4">
              
              <div className="px-2">
                <span className="text-4xs font-extrabold uppercase tracking-widest text-[#949ba4] block mb-2">
                  Find Conversant Friends
                </span>
                <div className="relative">
                  <Search className="absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    placeholder="Search Users..."
                    className="w-full rounded-lg bg-black/40 py-1 pr-2.5 pl-8 text-3xs text-slate-100 placeholder-slate-650 outline-hidden border border-transparent focus:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-4xs font-extrabold uppercase tracking-widest text-[#949ba4] px-2 block mb-1.5">
                  Direct Messages ({filteredUsers.length})
                </span>

                {filteredUsers.map((u) => {
                  const dmRoomId = getPrivateRoomId(u.id);
                  const isRoomActive = activeChannelId === dmRoomId;
                  const isOnline = u.status === "online";
                  const unread = unreadCounts[dmRoomId] || 0;

                  return (
                    <button
                      key={u.id}
                      onClick={() => onChannelSelect(dmRoomId)}
                      className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 font-medium transition ${
                        isRoomActive ? style.itemActive : style.itemHover
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="relative h-6 w-6 shrink-0 rounded-full">
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain"
                          />
                          <span className={`absolute -right-0.5 -bottom-0.5 flex h-2 w-2 rounded-full ring-2 ${
                            currentTheme === "minimalist-light" ? "ring-[#f2f3f5]" : "ring-[#2b2d31]"
                          }`}>
                            <span className={`h-2 w-2 rounded-full inline-block ${
                              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                            }`} />
                          </span>
                        </div>
                        <span className="truncate text-2xs text-left">{u.username}</span>
                      </div>
                      
                      {unread > 0 && (
                        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-4xs font-bold leading-none ${style.badgeBg}`}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <p className="px-2 text-4xs text-slate-500 italic">No direct friends found</p>
                )}
              </div>

            </div>
          ) : (
            /* CHANNELS AND VOICE ROOMS LISTS */
            <div className="space-y-5">
              
              {/* TEXT CHANNELS GROUP */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-4xs font-bold uppercase tracking-widest text-[#949ba4]">
                    Text Channels ({textChannels.length})
                  </span>
                  <button
                    onClick={onOpenCreateChannel}
                    title="Create text or voice channel"
                    className="p-0.5 hover:bg-slate-800 hover:text-white rounded text-slate-400"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {textChannels.map((tc) => {
                    const isRoomActive = activeChannelId === tc.id;
                    const unread = unreadCounts[tc.id] || 0;
                    return (
                      <button
                        key={tc.id}
                        onClick={() => onChannelSelect(tc.id)}
                        className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 font-medium transition ${
                          isRoomActive ? style.itemActive : style.itemHover
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300" />
                          <span className="truncate text-2xs text-left">{tc.name}</span>
                        </div>

                        {unread > 0 && (
                          <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-4xs font-bold leading-none ${style.badgeBg}`}>
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VOICE CHANNELS GROUP */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-4xs font-bold uppercase tracking-widest text-[#949ba4]">
                    Voice Channels ({voiceChannels.length})
                  </span>
                </div>

                <div className="space-y-1">
                  {voiceChannels.map((vc) => {
                    const isVoiceActive = activeVoiceChannelId === vc.id;
                    
                    // Filter members currently joined inside this specific voice channel
                    const channelMembers = users.filter((u) => u.currentVoiceChannelId === vc.id);

                    return (
                      <div key={vc.id} className="space-y-0.5">
                        
                        <button
                          onClick={() => onChannelSelect(vc.id)}
                          className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                            isVoiceActive 
                              ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400" 
                              : style.itemHover
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Volume2 className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300" />
                            <span className="truncate text-3xs text-left">{vc.name}</span>
                          </div>

                          {channelMembers.length > 0 && (
                            <span className="text-4xs text-teal-400 bg-teal-950/40 px-1 py-0.5 rounded border border-teal-500/10 font-bold">
                              {channelMembers.length} Joined
                            </span>
                          )}
                        </button>

                        {/* List nested avatars of participants inside voice */}
                        {channelMembers.length > 0 && (
                          <div className="pl-6.5 pr-2 py-1 space-y-1">
                            {channelMembers.map((memb) => (
                              <div key={memb.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <div className="relative">
                                    <img
                                      src={memb.avatarUrl}
                                      alt={memb.username}
                                      referrerPolicy="no-referrer"
                                      className={`h-5 w-5 object-contain rounded-full border bg-slate-900/60 p-0.5 ${
                                        memb.isSpeaking 
                                          ? "border-emerald-400 ring-2 ring-emerald-400/50 scale-105" 
                                          : "border-slate-700"
                                      }`}
                                    />
                                    {memb.isSpeaking && (
                                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    )}
                                  </div>
                                  <span className={`text-4xs truncate ${memb.isSpeaking ? "text-emerald-400 font-bold" : "text-slate-400"}`}>
                                    {memb.username}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-slate-500 shrink-0">
                                  {memb.isMuted && <MicOff className="h-2.5 w-2.5 text-red-400" />}
                                  {memb.isDeafened && <Headphones className="h-2.5 w-2.5 text-red-500" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* 3. DISCORD DYNAMIC VOICE FOOTER PANEL (Appears whenever User joins a Voice Channel) */}
        {activeVoiceChannelId && activeVoiceChannel && (
          <div className="bg-[#232428] p-2 border-t border-slate-900/80 text-[#232428] font-sans">
            <div className="rounded-lg bg-black/35 p-2 border border-emerald-500/20 shadow-lg text-left">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 animate-pulse">
                    <Volume2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-4xs font-bold uppercase text-emerald-400 tracking-wider">
                      Voice Connected
                    </span>
                    <span className="truncate text-3xs text-white">
                      {activeVoiceChannel.name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onDisconnectVoice}
                  title="Disconnect sound call connection"
                  className="rounded bg-red-600 p-1 text-white hover:bg-red-500 hover:scale-105 active:scale-95 transition"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Status information of speaking participants */}
              {speakersInVoice.length > 1 && (
                <div className="mt-1.5 border-t border-slate-800 pt-1.5 flex items-center gap-1 overflow-hidden">
                  <span className="text-4xs text-slate-400">Call members:</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {speakersInVoice.slice(0, 5).map((u) => (
                      <img
                        key={u.id}
                        src={u.avatarUrl}
                        alt={u.username}
                        referrerPolicy="no-referrer"
                        className="h-4.5 w-4.5 rounded-full border border-slate-900 bg-slate-950 p-[1px] object-contain shrink-0"
                      />
                    ))}
                  </div>
                  {speakersInVoice.length > 5 && (
                    <span className="text-4xs font-mono text-slate-500 font-bold whitespace-nowrap">
                      +{speakersInVoice.length - 5}
                    </span>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* 4. DISCORD CENTRAL USER STATUS CONTROL BAR (Bottom of middlest sidebar) */}
        <div className={`p-2 border-t flex items-center justify-between ${style.footerBg}`}>
          
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="relative h-7.5 w-7.5 shrink-0 rounded-full bg-slate-800 p-0.5 border border-slate-700/60">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
              <span className="absolute -right-0.5 -bottom-0.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#232428]" />
              
              {/* Dynamic live speak indicators */}
              {currentUser.isSpeaking && (
                <span className="absolute -top-0.5 -left-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[#232428] animate-ping" />
              )}
            </div>

            <div className="flex flex-col text-left overflow-hidden min-w-0">
              <span className="truncate text-3xs font-bold text-white leading-none mb-0.5">
                {currentUser.username}
              </span>
              <span className={`text-4xs block truncate leading-none ${style.textMuted}`}>
                {currentUser.isSpeaking ? "🎙️ transmitting voice" : "status: online"}
              </span>
            </div>
          </div>

          {/* Quick voice toggle actions */}
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            
            <button
              onClick={onToggleMute}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
              className={`p-1 rounded-sm transition ${
                isMuted ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "hover:bg-slate-800"
              }`}
            >
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={onToggleDeafen}
              title={isDeafened ? "Undeafen device sound" : "Deafen device sound"}
              className={`p-1 rounded-sm transition ${
                isDeafened ? "bg-red-500/15 text-red-500 hover:bg-red-500/25" : "hover:bg-slate-800"
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onLogout}
              title="Logout Account"
              className="p-1 rounded-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
