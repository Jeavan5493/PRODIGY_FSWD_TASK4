import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send as SendIcon,
  Paperclip as PaperclipIcon,
  Image as ImageGraphicIcon,
  File as FileGenericIcon,
  Loader2 as SpinnerIcon,
  ShieldAlert as ShieldErrorIcon,
  Hash as HashIcon,
  Download as DownloadIcon,
  Terminal as ConsoleIcon,
  Volume2 as SpeakerUpIcon,
  VolumeX as SpeakerMuteIcon,
  Users as UsersGroupIcon,
  Mic as MicIcon,
  MicOff as MicMuteIcon,
  Headphones as HeadphoneIcon,
  Bell as BellAlertIcon,
  Search as SearchBoxIcon,
  MessageSquare as ChatBubbleIcon,
  Sparkles as MagicStarIcon,
  PhoneOff as PhoneHangUpIcon,
  UserCheck as UsersInTouchIcon,
  Disc as MusicDiscIcon,
  Palette as PaintbrushIcon
} from "lucide-react";
import { User as ChatUser, Channel, Message, UITheme } from "../types";
import { formatBytes } from "../utils";

interface ChatAreaProps {
  currentUser: ChatUser;
  activeChannelId: string;
  channels: Channel[];
  users: ChatUser[];
  messages: Message[];
  typers: Array<{ roomId: string; userId: string; username: string; isTyping: boolean }>;
  onSendMessage: (payload: {
    roomId: string;
    content: string;
    type: "text" | "image" | "file";
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
  }) => void;
  onTypingStatus: (roomId: string, isTyping: boolean) => void;
  onVoiceStateUpdate: (channelId: string | null) => void;
  onVoiceSpeakingUpdate: (isSpeaking: boolean) => void;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  currentTheme: UITheme;
  onChangeTheme: (theme: UITheme) => void;
}

export default function ChatArea({
  currentUser,
  activeChannelId,
  channels,
  users,
  messages,
  typers,
  onSendMessage,
  onTypingStatus,
  onVoiceStateUpdate,
  onVoiceSpeakingUpdate,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  currentTheme,
  onChangeTheme,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showMembersList, setShowMembersList] = useState(true);
  const [localVolume, setLocalVolume] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse active channel
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const isVoiceChannel = activeChannel?.type === "voice";

  // Filter messages for current active channel
  const activeMessages = messages.filter((m) => m.roomId === activeChannelId);

  // Filter typers in this room
  const activeRoomTypers = typers.filter(
    (t) => t.roomId === activeChannelId && t.userId !== currentUser.id && t.isTyping
  );

  // Theme styling mapper
  const getThemeStyles = () => {
    switch (currentTheme) {
      case "cyberpunk-neon":
        return {
          wrapperBg: "bg-black text-[#00ffcc] border-fuchsia-900/30",
          headerBg: "bg-black border-b border-fuchsia-950/80 shadow-[0_0_15px_rgba(255,0,127,0.15)]",
          sidebarBg: "bg-black/95 border-l border-fuchsia-950/60",
          chatContainer: "bg-black text-slate-100",
          bubbleMe: "bg-linear-to-tr from-[#ff007f] to-[#aa00ff] text-white rounded-tr-none font-mono tracking-wide shadow-[0_0_10px_rgba(255,0,127,0.3)]",
          bubbleThem: "bg-slate-950 text-slate-100 border border-fuchsia-900/40 rounded-tl-none font-mono",
          inputWrapper: "bg-[#0b0214] border border-fuchsia-950 focus-within:border-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.1)]",
          accentColor: "text-[#ff007f]",
          accentBtn: "bg-[#ff007f] hover:bg-[#ff409f] text-slate-950",
          textMuted: "text-purple-400",
          cardBg: "bg-[#080212] border border-fuchsia-900/30",
          onlineDot: "bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]",
        };
      case "minimalist-light":
        return {
          wrapperBg: "bg-[#ffffff] text-slate-800 border-slate-200",
          headerBg: "bg-[#ffffff] border-b border-slate-200",
          sidebarBg: "bg-[#f2f3f5] border-l border-slate-200",
          chatContainer: "bg-[#ffffff] text-slate-800",
          bubbleMe: "bg-teal-600 text-white rounded-tr-none",
          bubbleThem: "bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none",
          inputWrapper: "bg-slate-50 border border-slate-200 focus-within:border-teal-600",
          accentColor: "text-teal-600",
          accentBtn: "bg-teal-600 hover:bg-teal-500 text-white",
          textMuted: "text-slate-500",
          cardBg: "bg-slate-50 border border-slate-200",
          onlineDot: "bg-emerald-500",
        };
      case "forest-sage":
        return {
          wrapperBg: "bg-[#1f2d26] text-emerald-300 border-emerald-950/40",
          headerBg: "bg-[#1f2d26] border-b border-emerald-950/80 shadow-sm",
          sidebarBg: "bg-[#17231d] border-l border-emerald-950/60",
          chatContainer: "bg-[#1f2d26] text-emerald-100",
          bubbleMe: "bg-emerald-600 text-slate-100 rounded-tr-none border border-emerald-400/25",
          bubbleThem: "bg-[#27382f] text-emerald-100 border border-emerald-900/40 rounded-tl-none",
          inputWrapper: "bg-[#17221c] border border-emerald-950 focus-within:border-emerald-400",
          accentColor: "text-emerald-400",
          accentBtn: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
          textMuted: "text-emerald-600/80",
          cardBg: "bg-[#1a2620] border border-emerald-900/30",
          onlineDot: "bg-emerald-400",
        };
      case "discord-midnight":
      default:
        return {
          wrapperBg: "bg-[#313338] text-slate-100 border-slate-900",
          headerBg: "bg-[#313338] border-b border-[#232428]/80 shadow-xs",
          sidebarBg: "bg-[#2b2d31] border-l border-[#1e1f22]/80",
          chatContainer: "bg-[#313338] text-slate-100",
          bubbleMe: "bg-indigo-500 text-white rounded-tr-none",
          bubbleThem: "bg-[#2b2d31] text-slate-100 border border-slate-800 rounded-tl-none",
          inputWrapper: "bg-[#383a40] border border-transparent focus-within:border-indigo-500",
          accentColor: "text-indigo-400",
          accentBtn: "bg-[#5865f2] hover:bg-[#4752c4] text-white",
          textMuted: "text-[#949ba4]",
          cardBg: "bg-[#2b2d31] border border-slate-800",
          onlineDot: "bg-emerald-500",
        };
    }
  };

  const css = getThemeStyles();

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeChannelId, isVoiceChannel]);

  // Real voice microphone amplitude monitor
  useEffect(() => {
    if (!isVoiceChannel) return;
    if (isMuted || isDeafened) {
      setLocalVolume(0);
      onVoiceSpeakingUpdate(false);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let javascriptNode: ScriptProcessorNode | null = null;
    let stream: MediaStream | null = null;

    async function initializeMicrophone() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.75;
        analyser.fftSize = 512;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = () => {
          if (!analyser) return;
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;
          const length = array.length;
          for (let i = 0; i < length; i++) {
            values += array[i];
          }
          const average = values / length;
          const volumeValue = Math.min(Math.round(average * 1.5), 100);

          setLocalVolume(volumeValue);

          // speaking trigger threshold is average > 6
          const speakingFlag = volumeValue > 8;
          onVoiceSpeakingUpdate(speakingFlag);
        };
      } catch (err) {
        console.warn("Microphone access declined or unavailable in workspace iframe", err);
      }
    }

    initializeMicrophone();

    return () => {
      if (javascriptNode) javascriptNode.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onVoiceSpeakingUpdate(false);
      setLocalVolume(0);
    };
  }, [isMuted, isDeafened, activeChannelId, isVoiceChannel]);

  // Handle textual sending
  const handleSendText = () => {
    if (!inputText.trim() || !activeChannel) return;
    onSendMessage({
      roomId: activeChannel.id,
      content: inputText.trim(),
      type: "text",
    });
    setInputText("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTypingStatus(activeChannel.id, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendText();
    } else if (activeChannel) {
      onTypingStatus(activeChannel.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTypingStatus(activeChannel.id, false);
      }, 1500);
    }
  };

  // Safe unmount clearing of typers
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Base64 file attachments uploading
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannel) return;

    setIsUploading(true);
    setUploadError("");

    const isImageFile = file.type.startsWith("image/");
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Str = reader.result as string;

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            base64Data: base64Str,
          }),
        });

        if (!response.ok) {
          throw new Error("Backend file size or upload ceiling rejected.");
        }

        const data = await response.json();

        // Relay over socket
        onSendMessage({
          roomId: activeChannel.id,
          content: file.name,
          type: isImageFile ? "image" : "file",
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: formatBytes(file.size),
        });

      } catch (err) {
        console.error(err);
        setUploadError("Attachment upload failed. Check container file size limit.");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setUploadError("Parser exception reading file.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Filter members belonging to current server context
  const activeServerId = activeChannel?.serverId || "home";
  
  // Direct Messages don't list everyone, they only display self and that specific partner user
  const isDM = activeChannelId.startsWith("private-");
  let rightSidebarHeader = "Server Members";
  
  const getShownUsers = () => {
    if (isDM) {
      const parts = activeChannelId.split("-");
      const otherId = parts.find((p) => p !== "private" && p !== currentUser.id);
      const dmPartner = users.find((u) => u.id === otherId);
      rightSidebarHeader = "Chat Recipient";
      return dmPartner ? [currentUser, dmPartner] : [currentUser];
    }
    // General server - list all registered users
    return users;
  };

  const shownUsers = getShownUsers();
  const onlineUsers = shownUsers.filter((u) => u.status === "online");
  const offlineUsers = shownUsers.filter((u) => u.status === "offline");

  // Determine vocal channel users
  const vocalParticipants = users.filter((u) => u.currentVoiceChannelId === activeChannelId);

  return (
    <div className={`flex h-full w-full select-none overflow-hidden font-sans border-l ${css.wrapperBg}`}>
      
      {/* CENTRAL DISCORD-STYLE WORKSPACE SCREEN */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* TOP COMPONENT HEADER PANEL */}
        <div className={`h-12 px-4.5 flex items-center justify-between border-b ${css.headerBg}`}>
          <div className="flex items-center gap-2 overflow-hidden min-w-0 text-left">
            {!isVoiceChannel ? (
              <HashIcon className="h-4.5 w-4.5 text-slate-500 shrink-0" />
            ) : (
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
            )}
            <h1 className="text-sm font-semibold text-white truncate">
              {activeChannel ? activeChannel.name : "Select conversation"}
            </h1>
            <span className="text-3xs text-slate-500 hidden md:inline truncate ml-2 border-l border-slate-800/80 pl-2">
              {activeChannel?.description || "Welcome workspace"}
            </span>
          </div>

          {/* Quick theme samples and toggle members actions */}
          <div className="flex items-center gap-4 text-slate-400">
            
            {/* Direct notify notification status warning anchor */}
            <button
              onClick={() => {
                if (Notification.permission === "default") {
                  Notification.requestPermission();
                }
              }}
              title="Permit system-wide toast notifications"
              className="rounded p-1 hover:bg-slate-800 transition hover:text-white"
            >
              <BellAlertIcon className="h-4.5 w-4.5" />
            </button>

            {/* Collapse/Expand Server Members layout toggle */}
            <button
              onClick={() => setShowMembersList(!showMembersList)}
              title={showMembersList ? "Hide side members list" : "Show side members list"}
              className={`rounded p-1 transition ${
                showMembersList ? "text-[#5865f2] bg-slate-800/60" : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <UsersGroupIcon className="h-4.5 w-4.5" />
            </button>

          </div>
        </div>

        {/* COMPONENT BODY WORKSPACE CONTENT */}
        <div className="flex-1 flex overflow-hidden">
          
          {isVoiceChannel ? (
            
            /* 1. DISCORD EXTREME HIGH-POLISHED INTERACTIVE ACTIVE VOICE PANEL SCREEN */
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center bg-slate-950">
              <div className="max-w-3xl w-full text-center space-y-6">
                
                {/* Voice Call Header state visual */}
                <div className="inline-flex gap-2.5 items-center rounded-full bg-emerald-500/10 px-5 py-2 border border-emerald-400/20 shadow-inner">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-2xs font-mono font-bold tracking-wide uppercase text-emerald-400">
                    Active Multi-user Call Hub System
                  </span>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-white mb-1 font-sans">
                  Dynamic Voice Lounge: {activeChannel?.name}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Microphone inputs are analyzed in real-time. When speaking is detected, your avatar status circle ripples green matching official Discord channels!
                </p>

                {/* Voice participants elegant stage grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-8">
                  {vocalParticipants.map((vUser) => {
                    const isMeInCall = vUser.id === currentUser.id;
                    const isSpeakingNow = isMeInCall ? localVolume > 8 : vUser.isSpeaking;

                    return (
                      <motion.div
                        key={vUser.id}
                        layout
                        className={`rounded-2xl p-5 flex flex-col items-center justify-center transition-all ${
                          isSpeakingNow
                            ? "bg-emerald-950/20 border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)] scale-105"
                            : "bg-slate-900 border border-slate-800"
                        }`}
                      >
                        {/* Avatar box surrounded by live speaker ripples */}
                        <div className="relative mb-3.5">
                          <img
                            src={vUser.avatarUrl}
                            alt={vUser.username}
                            referrerPolicy="no-referrer"
                            className={`h-16 w-16 rounded-full bg-slate-950 p-1 object-contain border ${
                              isSpeakingNow ? "border-emerald-400 rotate-1" : "border-slate-700"
                            }`}
                          />

                          {/* Sound wave overlay */}
                          {isSpeakingNow && (
                            <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                          )}

                          {/* Controls micro overlays */}
                          <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                            {vUser.isMuted && (
                              <span className="bg-red-500 text-white rounded-full p-1 border border-slate-950 shrink-0">
                                <MicMuteIcon className="h-2.5 w-2.5" />
                              </span>
                            )}
                            {vUser.isDeafened && (
                              <span className="bg-red-650 text-white rounded-full p-1 border border-slate-950 shrink-0">
                                <HeadphoneIcon className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-xs font-semibold ${isSpeakingNow ? "text-emerald-300" : "text-white"}`}>
                          {vUser.username} {isMeInCall && "(You)"}
                        </span>

                        <span className="text-4xs text-slate-500 tracking-wider font-mono uppercase mt-0.5">
                          {isSpeakingNow ? "🎙️ Speaking Live" : "Idle soundstate"}
                        </span>

                        {/* Reactive local real microphone signal bar */}
                        {isMeInCall && !isMuted && !isDeafened && (
                          <div className="w-24 bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800 p-[1px]">
                            <div
                              style={{ width: `${localVolume}%` }}
                              className="bg-emerald-400 h-full rounded-full transition-all duration-75"
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {vocalParticipants.length === 0 && (
                    <div className="col-span-full border border-dashed border-slate-800 rounded-2xl p-10 bg-slate-900/40 text-center">
                      <SpinnerIcon className="h-8 w-8 animate-spin text-teal-400 mx-auto mb-3" />
                      <p className="text-xs text-slate-400 italic">Synchroning connections stream...</p>
                    </div>
                  )}
                </div>

                {/* Call panel controls */}
                <div className="flex justify-center gap-4 pt-6 border-t border-slate-900 max-w-sm mx-auto">
                  
                  <button
                    onClick={onToggleMute}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                      isMuted 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" 
                        : "bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {isMuted ? <MicMuteIcon className="h-5 w-5" /> : <MicIcon className="h-5 w-5" />}
                  </button>

                  <button
                    onClick={onToggleDeafen}
                    title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
                    className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                      isDeafened 
                        ? "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30" 
                        : "bg-slate-800 text-slate-350 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <HeadphoneIcon className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => {
                      // disconnect
                      onVoiceStateUpdate(null);
                    }}
                    title="Disconnect / Leave Voice room"
                    className="h-11 w-11 rounded-full bg-red-650 flex items-center justify-center text-white bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 transition-all"
                  >
                    <PhoneHangUpIcon className="h-5 w-5" />
                  </button>

                </div>

              </div>
            </div>

          ) : (
            
            /* 2. DISCORD STANDARD TEXT MESSAGES FEED AND COMPOSER */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
              
              {/* Message queue list container */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
                {activeMessages.map((msg, index) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isSystem = msg.type === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id || index} className="flex justify-center my-3">
                        <div className="flex items-center gap-2 max-w-md rounded-full bg-black/40 px-4.5 py-1.5 border border-slate-850">
                          <ConsoleIcon className="h-3 w-3 text-teal-400" />
                          <span className="text-4xs font-mono text-slate-400 text-center tracking-wider">
                            {msg.content}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex items-start gap-3 ${isMe ? "flex-row-reverse text-right" : "flex-row text-left"}`}
                    >
                      {/* Message avatar */}
                      <div className="h-8 w-8 shrink-0 rounded-full bg-slate-800 p-0.5 border border-slate-700/60 shadow-xs">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-contain"
                        />
                      </div>

                      {/* Box content wrapper */}
                      <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-2xs font-semibold text-slate-200">{msg.senderName}</span>
                          <span className="text-4xs text-slate-650 font-mono tracking-wide">{formattedTime}</span>
                        </div>

                        <div className={`rounded-2xl px-4 py-2 text-3xs md:text-2xs leading-relaxed ${isMe ? css.bubbleMe : css.bubbleThem}`}>
                          {msg.type === "text" && (
                            <p className="whitespace-pre-wrap break-all">{msg.content}</p>
                          )}

                          {msg.type === "image" && (
                            <div className="mt-1 overflow-hidden rounded-lg bg-black border border-slate-800 max-w-full">
                              <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName}
                                  referrerPolicy="no-referrer"
                                  className="max-h-56 max-w-full object-contain cursor-zoom-in hover:opacity-90"
                                />
                              </a>
                            </div>
                          )}

                          {msg.type === "file" && (
                            <div className="flex items-center gap-2.5 mt-1 p-2 rounded bg-black/40 text-left border border-slate-800">
                              <FileGenericIcon className="h-7 w-7 text-teal-400 shrink-0" />
                              <div className="overflow-hidden min-w-0">
                                <p className="font-bold truncate text-4xs text-slate-200">{msg.fileName}</p>
                                <p className="text-5xs text-slate-500 font-mono">{msg.fileSize}</p>
                              </div>
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded p-1 bg-slate-800 text-white hover:bg-slate-705"
                              >
                                <DownloadIcon className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeMessages.length === 0 && (
                  <div className={`max-w-xs mx-auto text-center p-8 rounded-2xl border border-dashed border-slate-800 ${css.cardBg}`}>
                    <PaintbrushIcon className="h-10 w-10 text-teal-500 mx-auto mb-3" />
                    <h4 className="text-xs font-bold text-white">This Channel is Clean</h4>
                    <p className="text-4xs text-slate-500 mt-1">Select attachments or write feedback prompts below to trigger group interactions.</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Upload errors banner */}
              {uploadError && (
                <div className="mx-5 mb-2.5 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-4xs text-red-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldErrorIcon className="h-3.5 w-3.5 text-red-400" />
                    {uploadError}
                  </span>
                  <button onClick={() => setUploadError("")} className="text-red-400 underline">Dismiss</button>
                </div>
              )}

              {/* Real-time typers indication */}
              <div className={`px-5 h-6 text-4xs italic flex items-center gap-1.5 ${css.textMuted}`}>
                <AnimatePresence>
                  {activeRoomTypers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      className="flex items-center gap-1.5"
                    >
                      <div className="flex gap-0.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce" />
                        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce delay-75" />
                        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce delay-150" />
                      </div>
                      <span>
                        {activeRoomTypers.map((t) => t.username).join(", ")} is typing...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Composer input bar */}
              <div className="px-5 pb-5 bg-slate-900">
                <div className={`rounded-xl p-2.5 flex items-center gap-2 ${css.inputWrapper}`}>
                  
                  <div>
                    <input
                      type="file"
                      id="upload-attachment-trigger"
                      className="hidden"
                      onChange={handleAttachmentUpload}
                      accept="image/*,video/*,application/pdf,text/*"
                    />
                    <button
                      onClick={() => document.getElementById("upload-attachment-trigger")?.click()}
                      disabled={isUploading}
                      title="Share dynamic audio files/images"
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                    >
                      {isUploading ? (
                        <SpinnerIcon className="h-4.5 w-4.5 animate-spin text-teal-400" />
                      ) : (
                        <PaperclipIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isUploading || !activeChannel}
                    placeholder={
                      !activeChannel 
                        ? "Select a text channel or start a Private Message to chat..." 
                        : "Write context / push instant feed..."
                    }
                    className="flex-1 bg-transparent py-1 outline-hidden text-2xs md:text-xs text-slate-100 placeholder-slate-600"
                  />

                  <button
                    onClick={handleSendText}
                    disabled={!inputText.trim() || isUploading || !activeChannel}
                    className="rounded p-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition disabled:opacity-30"
                  >
                    <SendIcon className="h-3.5 w-3.5 text-white" />
                  </button>

                </div>
              </div>

            </div>
          )}

          {/* 3. DISCORD RIGHT MEMBERS BAR (ONLINE / OFFLINE STATUS) */}
          {showMembersList && (
            <div className={`w-52 shrink-0 hidden lg:flex flex-col h-full overflow-y-auto px-4 py-4 space-y-4 ${css.sidebarBg}`}>
              
              <div>
                <h3 className="text-4xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Online Users ({onlineUsers.length})
                </h3>
                <div className="space-y-1.5">
                  {onlineUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={u.avatarUrl}
                          alt={u.username}
                          referrerPolicy="no-referrer"
                          className={`h-5.5 w-5.5 rounded-full bg-slate-950 p-[1px] object-contain border ${
                            u.isSpeaking ? "border-emerald-400 animate-pulse" : "border-slate-800"
                          }`}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
                      </div>
                      <span className="truncate text-3xs font-medium text-slate-200">
                        {u.username}
                      </span>
                    </div>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className="text-4xs text-slate-650 italic pl-1">Syncing presence...</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-4xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Offline Users ({offlineUsers.length})
                </h3>
                <div className="space-y-1.5">
                  {offlineUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 opacity-55">
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        referrerPolicy="no-referrer"
                        className="h-5.5 w-5.5 rounded-full bg-slate-950 p-[1px] object-contain border border-slate-900"
                      />
                      <span className="truncate text-3xs text-slate-400">
                        {u.username}
                      </span>
                    </div>
                  ))}
                  {offlineUsers.length === 0 && (
                    <p className="text-4xs text-slate-650 italic pl-1">All members online</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
