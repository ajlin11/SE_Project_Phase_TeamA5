import React, { useEffect, useState, useRef } from "react";
import { messageApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { Message } from "../types";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../api/axios";

interface ConversationPartner {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [selectedPartner, setSelectedPartner] =
    useState<ConversationPartner | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ConversationPartner[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  // Load existing conversation partners
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const res = await messageApi.getPartners();
      const ids = res.data.data;
      const partnerDetails = await Promise.all(
        ids.map(async (id: number) => {
          try {
            const userRes = await api.get(`/users/${id}`);
            const raw = userRes.data;
            const found = raw?.data;
            return found
              ? {
                  userId: found.id,
                  fullName: `${found.firstName} ${found.lastName}`,
                  email: found.email,
                  role: found.role,
                }
              : { userId: id, fullName: `User #${id}`, email: "", role: "" };
          } catch {
            return { userId: id, fullName: `User #${id}`, email: "", role: "" };
          }
        }),
      );
      setPartners(partnerDetails);
    } catch (e) {
      console.error(e);
    }
  };

  // WebSocket
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    const client = new Client({
      webSocketFactory: () => new SockJS("/api/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/user/queue/messages`, (msg) => {
          const received: Message = JSON.parse(msg.body);
          if (
            selectedPartner &&
            (received.senderId === selectedPartner.userId ||
              received.receiverId === selectedPartner.userId)
          ) {
            setConversation((prev) => [...prev, received]);
          }
        });
      },
    });
    client.activate();
    stompClientRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [user, selectedPartner]);

  // Load conversation when partner selected
  useEffect(() => {
    if (!selectedPartner) return;
    setLoading(true);
    messageApi
      .getConversation(selectedPartner.userId)
      .then((r) => {
        setConversation(r.data.data);
        messageApi.markAsRead(selectedPartner.userId).catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPartner]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      // Try admin endpoint first, fallback to searching by known users
      let users: any[] = [];
      try {
        const res = await api.get(
          `/users/search?query=${encodeURIComponent(searchQuery)}`,
        );
        const raw = res.data;
        if (raw?.data?.content) users = raw.data.content;
        else if (Array.isArray(raw?.data)) users = raw.data;
        else if (raw?.content) users = raw.content;
        else if (Array.isArray(raw)) users = raw;
      } catch {
        // Non-admin users can't access admin endpoint
        // Search through all users endpoint
        const res = await api.get(`/admin/users?page=0&size=100`);
        const raw = res.data;
        let all: any[] = [];
        if (raw?.data?.content) all = raw.data.content;
        else if (Array.isArray(raw?.data)) all = raw.data;
        else if (raw?.content) all = raw.content;
        else if (Array.isArray(raw)) all = raw;
        users = all.filter(
          (u: any) =>
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      const results = users
        .filter((u: any) => u.id !== user?.userId)
        .map((u: any) => ({
          userId: u.id,
          fullName: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
        }));
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    }
  };

  const startChat = (partner: ConversationPartner) => {
    setSelectedPartner(partner);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    if (!partners.find((p) => p.userId === partner.userId)) {
      setPartners((prev) => [partner, ...prev]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;
    const content = newMessage.trim();
    setNewMessage("");
    try {
      const res = await messageApi.send({
        receiverId: selectedPartner.userId,
        content,
      });
      // Add message to conversation immediately
      setConversation((prev) => [...prev, res.data.data]);
    } catch (err) {
      console.error(err);
      setNewMessage(content); // restore if failed
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💬 Messages</div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowSearch(!showSearch)}
        >
          + New Conversation
        </button>
      </div>

      {/* Search for users */}
      {showSearch && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Start a new conversation</div>
          <div className="flex-gap">
            <input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
            <button className="btn btn-primary" onClick={searchUsers}>
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {searchResults.map((r) => (
                <div
                  key={r.userId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                    <div className="text-muted">
                      {r.email} · {r.role}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => startChat(r)}
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div
            style={{
              padding: "12px 16px",
              fontWeight: 600,
              borderBottom: "1px solid #f3f4f6",
              color: "#1a56db",
            }}
          >
            Conversations
          </div>
          {partners.length === 0 ? (
            <div className="text-muted" style={{ padding: 16 }}>
              No conversations yet.
            </div>
          ) : (
            partners.map((p) => (
              <div
                key={p.userId}
                className={`chat-partner ${selectedPartner?.userId === p.userId ? "active" : ""}`}
                onClick={() => setSelectedPartner(p)}
              >
                <div className="chat-partner-name">{p.fullName}</div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {p.role}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {!selectedPartner ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
              }}
            >
              Select a conversation or start a new one
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "12px 16px",
                  fontWeight: 600,
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                {selectedPartner.fullName}{" "}
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                  ({selectedPartner.role})
                </span>
              </div>
              <div className="chat-messages">
                {loading ? (
                  <div className="text-muted">Loading...</div>
                ) : conversation.length === 0 ? (
                  <div className="text-muted" style={{ textAlign: "center" }}>
                    No messages yet. Say hello!
                  </div>
                ) : (
                  conversation.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          msg.senderId === user?.userId
                            ? "flex-end"
                            : "flex-start",
                      }}
                    >
                      <div
                        className={`message-bubble ${msg.senderId === user?.userId ? "sent" : "received"}`}
                      >
                        {msg.content}
                      </div>
                      <div className="message-time">
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="chat-input-row">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
