import React, { useState, useEffect, useRef } from "react";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import RoomModal from "./components/RoomModal";
import { User, ServerGroup, Channel, Message, UITheme } from "./types";
import { playChime, playJoinChime, playLeaveChime } from "./utils";
import { RefreshCw, Radio } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App DB states
  const [servers, setServers] = useState<ServerGroup[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Selection configurations
  const [activeServerId, setActiveServerId] = useState<string>("home");
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);

  // Sound and toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<UITheme>("discord-midnight");

  // Notifications
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typers, setTypers] = useState<
    Array<{ roomId: string; userId: string; username: string; isTyping: boolean }>
  >([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultMode, setModalDefaultMode] = useState<"channel" | "server">("channel");

  // Network checks
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);

  // Load user session and client-wide theme from storage
  useEffect(() => {
    const savedUser = localStorage.getItem("chat_current_user_v2");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) {
          setCurrentUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem("chat_current_user_v2");
      }
    }

    const savedTheme = localStorage.getItem("chat_ui_theme") as UITheme;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Sync client socket on authentication
  useEffect(() => {
    if (!currentUser) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const isSec = window.location.protocol === "https:";
    const proto = isSec ? "wss:" : "ws:";
    const socketStr = `${proto}//${window.location.host}/?userId=${encodeURIComponent(currentUser.id)}`;

    const ws = new WebSocket(socketStr);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setReconnectCount(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        if (type === "init") {
          setServers(payload.servers);
          setChannels(payload.channels);
          setUsers(payload.users);
          setMessages(payload.messages);

          // Select first text channel of first server as default initially
          const defaultServer = payload.servers[0];
          if (defaultServer) {
            const firstChan = payload.channels.find(
              (c: Channel) => c.serverId === defaultServer.id && c.type === "text"
            );
            if (firstChan) {
              setActiveServerId(defaultServer.id);
              setActiveChannelId(firstChan.id);
            }
          }
        } else if (type === "message") {
          const newMsg = payload as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Unread counters and alert chimes
          if (newMsg.senderId !== currentUser.id) {
            if (newMsg.roomId !== activeChannelId) {
              setUnreadCounts((p) => ({
                ...p,
                [newMsg.roomId]: (p[newMsg.roomId] || 0) + 1,
              }));
            }

            // Play message chime unless deafened
            if (!isDeafened) {
              playChime();
            }

            // Desktop native alerts
            if (Notification.permission === "granted") {
              const bodyMsg = newMsg.type === "text" ? newMsg.content : `Uploaded dynamic file: ${newMsg.fileName}`;
              new Notification(`Message from ${newMsg.senderName}`, {
                body: bodyMsg,
                icon: newMsg.senderAvatar,
              });
            }
          }

        } else if (type === "user_status") {
          const { userId, status } = payload;
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, status } : u))
          );

        } else if (type === "user_typing") {
          const { roomId, userId, username, isTyping } = payload;
          setTypers((prev) => {
            const filtered = prev.filter((t) => !(t.roomId === roomId && t.userId === userId));
            return [...filtered, { roomId, userId, username, isTyping }];
          });

        } else if (type === "server_created") {
          const newServer = payload as ServerGroup;
          setServers((prev) => {
            if (prev.some((s) => s.id === newServer.id)) return prev;
            return [...prev, newServer];
          });

        } else if (type === "channel_created") {
          const newChan = payload as Channel;
          setChannels((prev) => {
            if (prev.some((c) => c.id === newChan.id)) return prev;
            return [...prev, newChan];
          });

        } else if (type === "voice_state_update") {
          const { userId, channelId, isMuted: m, isDeafened: d } = payload;
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId
                ? { ...u, currentVoiceChannelId: channelId, isMuted: m, isDeafened: d }
                : u
            )
          );

          // Play voice join/leave tones for others
          if (userId !== currentUser.id) {
            const userMemb = users.find((u) => u.id === userId);
            const currentChanUser = users.find((u) => u.id === currentUser.id);

            // If joined or departed our channel context, play chime
            if (channelId && channelId === currentChanUser?.currentVoiceChannelId) {
              playJoinChime();
            } else if (!channelId && userMemb?.currentVoiceChannelId === currentChanUser?.currentVoiceChannelId) {
              playLeaveChime();
            }
          }

        } else if (type === "voice_speaking_update") {
          const { userId, isSpeaking } = payload;
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, isSpeaking } : u))
          );
        }

      } catch (err) {
        console.error("Inbound websocket exception:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      const reconnectTimer = setTimeout(() => {
        setReconnectCount((rc) => rc + 1);
      }, 3500);
      return () => clearTimeout(reconnectTimer);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [currentUser, reconnectCount]);

  // Handle Server select and switch to its general text channel
  const handleServerSelect = (serverId: string) => {
    setActiveServerId(serverId);
    if (serverId === "home") {
      setActiveChannelId("");
    } else {
      const serverChans = channels.filter((c) => c.serverId === serverId);
      const textChan = serverChans.find((c) => c.type === "text");
      if (textChan) {
        setActiveChannelId(textChan.id);
        setUnreadCounts((p) => ({ ...p, [textChan.id]: 0 }));
      } else {
        setActiveChannelId("");
      }
    }
  };

  // Handle Channel joining (Both Text and Voice calls)
  const handleChannelSelect = (channelId: string) => {
    const targetChan = channels.find((c) => c.id === channelId);
    
    // Clear unreads
    setUnreadCounts((p) => ({ ...p, [channelId]: 0 }));

    if (targetChan?.type === "voice") {
      // Join Voice Room
      if (activeVoiceChannelId !== channelId) {
        playJoinChime();
        setActiveVoiceChannelId(channelId);
        
        // Notify backend of voice join location change
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: "voice_state_update",
              payload: { channelId, isMuted, isDeafened },
            })
          );
        }
      }
      setActiveChannelId(channelId);
    } else {
      // Simple text room change
      setActiveChannelId(channelId);
    }
  };

  // Disconnect from background voice session
  const handleDisconnectVoice = () => {
    if (activeVoiceChannelId) {
      playLeaveChime();
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "voice_state_update",
            payload: { channelId: null, isMuted: false, isDeafened: false },
          })
        );
      }

      setActiveVoiceChannelId(null);
      
      // Fallback workspace focus to general chat
      const fallback = channels.find((c) => c.serverId === activeServerId && c.type === "text");
      if (fallback) {
        setActiveChannelId(fallback.id);
      }
    }
  };

  // Dispatch textual message frame
  const handleSendMessage = (payload: {
    roomId: string;
    content: string;
    type: "text" | "image" | "file";
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
  }) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "send_message",
          payload,
        })
      );
    }
  };

  // Dispatch typing indicator
  const handleTypingStatus = (roomId: string, isTyping: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          payload: { roomId, isTyping },
        })
      );
    }
  };

  // Create Channel
  const handleCreateChannel = (chanData: { name: string; type: "text" | "voice"; description: string }) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "create_channel",
          payload: {
            serverId: activeServerId,
            name: chanData.name,
            type: chanData.type,
            description: chanData.description,
          },
        })
      );
    }
  };

  // Create Server Group
  const handleCreateServer = (serverData: { name: string; description: string; iconUrl: string }) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "create_server",
          payload: {
            name: serverData.name,
            iconUrl: serverData.iconUrl,
            description: serverData.description,
          },
        })
      );
    }
  };

  // Toggle Mute mic
  const handleToggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    
    // Broadcast state update
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "voice_state_update",
          payload: { channelId: activeVoiceChannelId, isMuted: newVal, isDeafened },
        })
      );
    }
  };

  // Toggle Deafen
  const handleToggleDeafen = () => {
    const newVal = !isDeafened;
    setIsDeafened(newVal);
    
    // If deafened, auto mute mic
    const syncMuted = newVal ? true : isMuted;
    if (newVal) {
      setIsMuted(true);
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "voice_state_update",
          payload: { channelId: activeVoiceChannelId, isMuted: syncMuted, isDeafened: newVal },
        })
      );
    }
  };

  // Broadcast local microphone speaking level telemetry
  const handleVoiceSpeakingUpdate = (speakingFlag: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "voice_speaking_update",
          payload: { isSpeaking: speakingFlag },
        })
      );
    }
  };

  // Theme configuration helper
  const handleThemeChange = (theme: UITheme) => {
    setCurrentTheme(theme);
    localStorage.setItem("chat_ui_theme", theme);
  };

  const handleLogout = () => {
    localStorage.removeItem("chat_current_user_v2");
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: User) => {
    localStorage.setItem("chat_current_user_v2", JSON.stringify(user));
    setCurrentUser(user);
  };

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Generate clean current user representation with voice states
  const syncMe = users.find((u) => u.id === currentUser.id) || {
    ...currentUser,
    isMuted,
    isDeafened,
    currentVoiceChannelId: activeVoiceChannelId,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased select-none font-sans">
      
      {/* Network Offline Toast Indicator */}
      {!connected && (
        <div className="pointer-events-none fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-red-650 px-4 py-2.5 text-xs font-semibold text-white shadow-xl bg-red-605 backdrop-blur-md animate-pulse border border-red-500/10">
          <RefreshCw className="h-4 w-4 animate-spin text-red-105" />
          <span>Real-time link buffering...</span>
        </div>
      )}

      {/* Main Structural Grid Container */}
      <div className="flex h-full w-full">
        
        {/* Left Side Sidebar Components (Servers + Channels) */}
        <div className="w-76 shrink-0 h-full flex">
          <Sidebar
            currentUser={syncMe}
            servers={servers}
            channels={channels}
            users={users}
            activeServerId={activeServerId}
            activeChannelId={activeChannelId}
            onServerSelect={handleServerSelect}
            onChannelSelect={handleChannelSelect}
            onOpenCreateServer={() => {
              setModalDefaultMode("server");
              setIsModalOpen(true);
            }}
            onOpenCreateChannel={() => {
              setModalDefaultMode("channel");
              setIsModalOpen(true);
            }}
            onLogout={handleLogout}
            unreadCounts={unreadCounts}
            activeVoiceChannelId={activeVoiceChannelId}
            isMuted={isMuted}
            isDeafened={isDeafened}
            onToggleMute={handleToggleMute}
            onToggleDeafen={handleToggleDeafen}
            onDisconnectVoice={handleDisconnectVoice}
            currentTheme={currentTheme}
            onChangeTheme={handleThemeChange}
          />
        </div>

        {/* Central Messages Chat View Area */}
        <div className="flex-1 h-full min-w-0">
          <ChatArea
            currentUser={syncMe}
            activeChannelId={activeChannelId}
            channels={channels}
            users={users}
            messages={messages}
            typers={typers}
            onSendMessage={handleSendMessage}
            onTypingStatus={handleTypingStatus}
            onVoiceStateUpdate={handleDisconnectVoice}
            onVoiceSpeakingUpdate={handleVoiceSpeakingUpdate}
            isMuted={isMuted}
            isDeafened={isDeafened}
            onToggleMute={handleToggleMute}
            onToggleDeafen={handleToggleDeafen}
            currentTheme={currentTheme}
            onChangeTheme={handleThemeChange}
          />
        </div>

      </div>

      {/* Dynamic Channels / Servers Builder modal */}
      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeServerId={activeServerId}
        onCreateChannel={handleCreateChannel}
        onCreateServer={handleCreateServer}
        currentTheme={currentTheme}
        defaultMode={modalDefaultMode}
      />

    </div>
  );
}
