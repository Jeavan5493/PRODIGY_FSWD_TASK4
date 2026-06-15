import express from "express";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { User, ServerGroup, Channel, Message } from "./src/types.js"; // Standard ES module imports

const app = express();
const PORT = 3000;

// Body size limit for base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure uploads folder exists and serve statically
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Keep-alive/In-memory DB
interface ServerUser extends User {
  passwordHash: string;
}

const usersDb = new Map<string, ServerUser>();
const serversDb = new Map<string, ServerGroup>();
const channelsDb = new Map<string, Channel>();
const messagesList: Message[] = [];

// Seed default servers (groups)
const defaultServers: ServerGroup[] = [
  {
    id: "server-tavern",
    name: "The Tavern",
    iconUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=120&q=80",
    description: "Our general community and lounge space. Sit by the fire!",
    createdAt: new Date().toISOString(),
  },
  {
    id: "server-gaming",
    name: "Pixel Gaming",
    iconUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=120&q=80",
    description: "Gaming discussions, patch updates, and voice call lobbies.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "server-ai",
    name: "Gemini AI Hub",
    iconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    description: "AI Developers & Creative Prompting space.",
    createdAt: new Date().toISOString(),
  },
];
defaultServers.forEach((s) => serversDb.set(s.id, s));

// Seed default channels inside servers
const defaultChannels: Channel[] = [
  // Tavern Channels
  { id: "chan-tavern-welcome", serverId: "server-tavern", name: "rules-and-welcome", type: "text", description: "Read the rules before introducing yourself", createdAt: new Date().toISOString() },
  { id: "chan-tavern-lounge", serverId: "server-tavern", name: "fireplace-lounge", type: "text", description: "Relaxed off-topic text messaging zone", createdAt: new Date().toISOString() },
  { id: "chan-tavern-voice1", serverId: "server-tavern", name: "🍻 Cozy Hearth Chamber", type: "voice", description: "Voice chat with ambient tavern chatter", createdAt: new Date().toISOString() },
  { id: "chan-tavern-voice2", serverId: "server-tavern", name: "🎵 Acoustic Corner", type: "voice", description: "Gather here to chat or listen to acoustic lines", createdAt: new Date().toISOString() },

  // Gaming Channels
  { id: "chan-gaming-chat", serverId: "server-gaming", name: "general-gaming", type: "text", description: "Share gameplay clips, high scores, & match logs", createdAt: new Date().toISOString() },
  { id: "chan-gaming-voice1", serverId: "server-gaming", name: "🎮 Squad Alpha Lobby", type: "voice", description: "Competitive voice comms for team lobby Alpha", createdAt: new Date().toISOString() },
  { id: "chan-gaming-voice2", serverId: "server-gaming", name: "🎲 Casual Sandbox", type: "voice", description: "Laidback multiplayer voice corner", createdAt: new Date().toISOString() },

  // AI Hub Channels
  { id: "chan-ai-chat", serverId: "server-ai", name: "gemini-synthesizers", type: "text", description: "Discuss multi-modal system updates, design prompts, and bots", createdAt: new Date().toISOString() },
  { id: "chan-ai-voice", serverId: "server-ai", name: "🧠 Neural Synapse", type: "voice", description: "Brainstorming and research voice room", createdAt: new Date().toISOString() },
];
defaultChannels.forEach((c) => channelsDb.set(c.id, c));

// Seed system bot / virtual friends to populate initially
const systemUser: ServerUser = {
  id: "system",
  username: "Wumpus Bot",
  avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  status: "online",
  joinedAt: new Date().toISOString(),
  passwordHash: "system-lock-777",
  isMuted: false,
  isDeafened: false,
  currentVoiceChannelId: null,
};
usersDb.set(systemUser.id, systemUser);

// Seed welcome welcome message
const welcomeMessage1: Message = {
  id: "seed-msg-1",
  roomId: "chan-tavern-welcome",
  senderId: "system",
  senderName: "Wumpus Bot",
  senderAvatar: systemUser.avatarUrl,
  content: "Welcome, gamer! You have arrived at the Tavern. Join our voice lobbies, mute/deafen yourself at will, and customize your UI appearance immediately!",
  type: "system",
  timestamp: new Date().toISOString(),
};
messagesList.push(welcomeMessage1);

// --- Express Auth APIs ---

// Register profile
app.post("/api/register", (req, res) => {
  const { username, password, avatarUrl } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const existing = Array.from(usersDb.values()).find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (existing) {
    res.status(499).json({ error: "Username has already been taken" });
    return;
  }

  const newUser: ServerUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    username: username.trim(),
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username.trim())}`,
    status: "offline",
    joinedAt: new Date().toISOString(),
    passwordHash: password,
    isMuted: false,
    isDeafened: false,
    currentVoiceChannelId: null,
  };

  usersDb.set(newUser.id, newUser);

  const { passwordHash, ...sanitized } = newUser;
  res.status(201).json(sanitized);
});

// Login profile
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = Array.from(usersDb.values()).find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const { passwordHash, ...sanitized } = user;
  res.json(sanitized);
});

// File upload endpoint for images and multi-media docs
app.post("/api/upload", (req, res) => {
  const { fileName, fileType, base64Data } = req.body;
  if (!fileName || !base64Data) {
    res.status(400).json({ error: "Missing payload details" });
    return;
  }

  try {
    let pureBase64 = base64Data;
    if (base64Data.includes(";base64,")) {
      pureBase64 = base64Data.split(";base64,")[1];
    }

    const buffer = Buffer.from(pureBase64, "base64");
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${timestamp}-${cleanFileName}`;
    const targetPath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(targetPath, buffer);

    res.status(200).json({ fileUrl: `/uploads/${uniqueName}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to persist asset attachment" });
  }
});


// --- WebSocket Server & low-latency Voice Signal routing ---

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Sockets routing maps
const activeSockets = new Map<string, Set<WebSocket>>();

const broadcastEvent = (event: any) => {
  const payloadStr = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payloadStr);
    }
  });
};

wss.on("connection", (socket: WebSocket, req) => {
  const params = new URLSearchParams(req.url?.split("?")[1]);
  const userId = params.get("userId");

  if (!userId || !usersDb.has(userId)) {
    socket.close(4001, "Unauthorized context");
    return;
  }

  const user = usersDb.get(userId)!;
  user.status = "online";
  usersDb.set(userId, user);

  // Track socket connections
  if (!activeSockets.has(userId)) {
    activeSockets.set(userId, new Set());
  }
  activeSockets.get(userId)!.add(socket);

  // Broadcast user online status change
  broadcastEvent({
    type: "user_status",
    payload: { userId, status: "online" },
  });

  // Sync initial full state across Server Groups, channels, online list, messages
  const sanitizedUsers = Array.from(usersDb.values()).map(({ passwordHash, ...rest }) => rest);
  const servers = Array.from(serversDb.values());
  const channels = Array.from(channelsDb.values());

  socket.send(
    JSON.stringify({
      type: "init",
      payload: {
        users: sanitizedUsers,
        servers,
        channels,
        messages: messagesList,
      },
    })
  );

  // Parse incoming websocket frames
  socket.on("message", (rawBytes) => {
    try {
      const data = JSON.parse(rawBytes.toString());
      const { type, payload } = data;

      if (type === "send_message") {
        const { roomId, content, type: msgType, fileUrl, fileName, fileSize } = payload;

        // Auto create DM rooms if it starts with private- and isn't logged inside rooms
        if (roomId.startsWith("private-") && !channelsDb.has(roomId)) {
          const parts = roomId.split("-");
          const receiverId = parts.find((p) => p !== "private" && p !== userId);
          const receiver = usersDb.get(receiverId || "");

          if (receiver) {
            const dynamicDMChannel: Channel = {
              id: roomId,
              serverId: "home",
              name: `dm-${receiver.username}`,
              type: "text",
              description: `Direct message channel for ${user.username} & ${receiver.username}`,
              createdAt: new Date().toISOString(),
            };
            channelsDb.set(roomId, dynamicDMChannel);
            broadcastEvent({
              type: "channel_created",
              payload: dynamicDMChannel,
            });
          }
        }

        const newMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          roomId,
          senderId: userId,
          senderName: user.username,
          senderAvatar: user.avatarUrl,
          content: content || "",
          type: msgType || "text",
          fileUrl,
          fileName,
          fileSize,
          timestamp: new Date().toISOString(),
        };

        messagesList.push(newMessage);
        broadcastEvent({
          type: "message",
          payload: newMessage,
        });

      } else if (type === "typing") {
        const { roomId, isTyping } = payload;
        const msgStr = JSON.stringify({
          type: "user_typing",
          payload: { roomId, userId, username: user.username, isTyping },
        });

        wss.clients.forEach((c) => {
          if (c !== socket && c.readyState === WebSocket.OPEN) {
            c.send(msgStr);
          }
        });

      } else if (type === "create_server") {
        // Create an organic guild group (server group)
        const { name, description, iconUrl } = payload;
        const newServerId = `server-${Date.now()}`;
        const defaultIcon = iconUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=120&q=80";

        const newServer: ServerGroup = {
          id: newServerId,
          name: name || "New Gaming Guild",
          iconUrl: defaultIcon,
          description: description || "Custom User Created Server Group",
          createdAt: new Date().toISOString(),
        };

        serversDb.set(newServerId, newServer);

        // Auto seed channels inside this fresh Server Group
        const textChannelId = `chan-${Date.now()}-general`;
        const voiceChannelId = `chan-${Date.now()}-voice`;

        const newTextChan: Channel = {
          id: textChannelId,
          serverId: newServerId,
          name: "general-chat",
          type: "text",
          description: "Default server texting zone",
          createdAt: new Date().toISOString(),
        };

        const newVoiceChan: Channel = {
          id: voiceChannelId,
          serverId: newServerId,
          name: "🔊 Gaming Lounge",
          type: "voice",
          description: "Low-latency voice channel stream",
          createdAt: new Date().toISOString(),
        };

        channelsDb.set(textChannelId, newTextChan);
        channelsDb.set(voiceChannelId, newVoiceChan);

        // Broadcast announcements to all clients
        broadcastEvent({
          type: "server_created",
          payload: newServer,
        });

        broadcastEvent({
          type: "channel_created",
          payload: newTextChan,
        });

        broadcastEvent({
          type: "channel_created",
          payload: newVoiceChan,
        });

      } else if (type === "create_channel") {
        const { serverId, name, type: chanType, description } = payload;
        const cleanName = chanType === "text" 
          ? name.trim().toLowerCase().replace(/[^a-z0-9\-]/g, "-") 
          : `🔊 ${name.trim()}`;

        const newChanId = `chan-${Date.now()}`;
        const newChannel: Channel = {
          id: newChanId,
          serverId,
          name: cleanName || "custom-channel",
          type: chanType || "text",
          description: description || "User-added channel",
          createdAt: new Date().toISOString(),
        };

        channelsDb.set(newChanId, newChannel);

        broadcastEvent({
          type: "channel_created",
          payload: newChannel,
        });

      } else if (type === "voice_state_update") {
        // Handle join, leave, mute, deafen updates
        const { channelId, isMuted, isDeafened } = payload;

        user.currentVoiceChannelId = channelId;
        user.isMuted = !!isMuted;
        user.isDeafened = !!isDeafened;
        usersDb.set(userId, user);

        // Broadcast to all to keep visual channels accurately occupied
        broadcastEvent({
          type: "voice_state_update",
          payload: {
            userId,
            channelId,
            isMuted: !!isMuted,
            isDeafened: !!isDeafened,
          },
        });

      } else if (type === "voice_speaking_update") {
        // Real-time voice signals relaying
        const { isSpeaking } = payload;
        user.isSpeaking = !!isSpeaking;
        usersDb.set(userId, user);

        broadcastEvent({
          type: "voice_speaking_update",
          payload: {
            userId,
            isSpeaking: !!isSpeaking,
          },
        });
      }

    } catch (err) {
      console.error("Websocket parsing/dispatch error:", err);
    }
  });

  // Client Offline triggers
  socket.on("close", () => {
    const userSockets = activeSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socket);
      if (userSockets.size === 0) {
        activeSockets.delete(userId);

        const current = usersDb.get(userId);
        if (current) {
          current.status = "offline";
          current.currentVoiceChannelId = null; // drop from voice channels
          current.isSpeaking = false;
          usersDb.set(userId, current);
        }

        // Broadcast user disconnect & voice drops
        broadcastEvent({
          type: "user_status",
          payload: { userId, status: "offline" },
        });

        broadcastEvent({
          type: "voice_state_update",
          payload: {
            userId,
            channelId: null,
            isMuted: false,
            isDeafened: false,
          },
        });
      }
    }
  });
});

// Upgrade capabilities
server.on("upgrade", (req, wsSocket, head) => {
  wss.handleUpgrade(req, wsSocket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// --- Boot express + vite development pipeline ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Express and WebSocket server running on http://localhost:${PORT}`);
  });
}

startServer();
