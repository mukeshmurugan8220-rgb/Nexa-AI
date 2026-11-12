import { useState, useEffect, useRef } from "react";

import {
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Send,
  Menu,
  Copy,
  Bot,
  Code,
  GraduationCap,
  Briefcase,
  PenTool,
  Moon,
  Sun,
  Trash2,
  X,
  PanelLeftClose,
  Check,
  User
} from "lucide-react";

import ReactMarkdown from "react-markdown";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";

import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";

import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { sendMessageToAI } from "./services/aiService";

import "./index.css";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", markup);

const PERSONAS = [
  { id: "general", name: "General Assistant", icon: Bot },
  { id: "coding", name: "Coding Expert", icon: Code },
  { id: "study", name: "Study Assistant", icon: GraduationCap },
  { id: "career", name: "Career Advisor", icon: Briefcase },
  { id: "writer", name: "Content Writer", icon: PenTool }
];

const SUGGESTIONS = [
  {
    icon: Code,
    title: "Build something",
    description: "Help me build a React application",
    prompt: "Help me build a modern React application step by step."
  },
  {
    icon: GraduationCap,
    title: "Learn something",
    description: "Explain a difficult topic simply",
    prompt: "Explain JavaScript asynchronous programming in simple terms."
  },
  {
    icon: Briefcase,
    title: "Career guidance",
    description: "Improve my developer career",
    prompt: "Give me a roadmap to become a professional full stack developer."
  },
  {
    icon: PenTool,
    title: "Create content",
    description: "Write something creative",
    prompt: "Help me write a professional LinkedIn post about my developer journey."
  }
];

const STORAGE_KEY = "nexaAI_conversations";
const THEME_KEY = "nexaAI_theme";
const ACTIVE_CHAT_KEY = "nexaAI_activeChat";

function createConversation() {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: "New Conversation",
    messages: [],
    persona: "general",
    updatedAt: Date.now()
  };
}

function MarkdownCode({ className, children, ...props }) {
  const [copied, setCopied] = useState(false);

  const language = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      console.error("Unable to copy code");
    }
  };

  if (language) {
    return (
      <div className="code-container">
        <div className="code-header">
          <span>{language[1]}</span>

          <button className="copy-btn" onClick={copyCode}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>

        <SyntaxHighlighter
          language={language[1]}
          style={oneDark}
          showLineNumbers
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="inline-code" {...props}>
      {children}
    </code>
  );
}

function App() {
  const [conversations, setConversations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  // RESTORE LAST ACTIVE CHAT AFTER REFRESH
  const [activeId, setActiveId] = useState(() => {
    try {
      const savedConversations =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

      const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);

      if (
        savedActiveId &&
        savedConversations.some((chat) => chat.id === savedActiveId)
      ) {
        return savedActiveId;
      }

      return savedConversations[0]?.id || null;
    } catch {
      return null;
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "dark"
  );

  const [persona, setPersona] = useState(() => {
    try {
      const savedConversations =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

      const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);

      const activeChat = savedConversations.find(
        (chat) => chat.id === savedActiveId
      );

      return activeChat?.persona || "general";
    } catch {
      return "general";
    }
  });

  const [search, setSearch] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(
    window.innerWidth > 768
  );

  const [copiedMessage, setCopiedMessage] = useState(null);

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  const activeConversation = conversations.find(
    (chat) => chat.id === activeId
  );

  const messages = activeConversation?.messages || [];

  // SAVE CONVERSATIONS
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations)
    );
  }, [conversations]);

  // SAVE ACTIVE CHAT
  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  }, [activeId]);

  // SAVE THEME
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // RESTORE PERSONA WHEN CHAT CHANGES
  useEffect(() => {
    if (activeConversation) {
      setPersona(activeConversation.persona || "general");
    }
  }, [activeId]);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, loading]);

  // NEW CHAT
  const handleNewChat = () => {
    if (loading) return;

    const chat = createConversation();

    setConversations((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    setPersona("general");
    setInput("");
    setSidebarOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // SELECT CHAT
  const selectConversation = (chat) => {
    setActiveId(chat.id);
    setPersona(chat.persona || "general");
    setInput("");

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // DELETE CHAT
  const deleteConversation = (id) => {
    setConversations((prev) =>
      prev.filter((chat) => chat.id !== id)
    );

    if (activeId === id) {
      setActiveId(null);
      setInput("");
    }
  };

  // UPDATE CHAT
  const updateConversation = (id, callback) => {
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...callback(chat),
              updatedAt: Date.now()
            }
          : chat
      )
    );
  };

  // COPY MESSAGE
  const copyMessage = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedMessage(id);

      setTimeout(() => setCopiedMessage(null), 1500);
    } catch {
      console.error("Copy failed");
    }
  };

  // SEND MESSAGE
  const handleSendMessage = async (customMessage) => {
    const userMessage = (customMessage || input).trim();

    if (!userMessage || loading) return;

    let chatId = activeId;

    let currentMessages = [];
    let selectedPersona = persona;

    if (!chatId) {
      const newChat = createConversation();

      chatId = newChat.id;

      setActiveId(chatId);

      setConversations((prev) => [newChat, ...prev]);
    } else {
      const currentChat = conversations.find(
        (chat) => chat.id === chatId
      );

      currentMessages = currentChat?.messages || [];
      selectedPersona = currentChat?.persona || persona;
    }

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage
    };

    const updatedMessages = [...currentMessages, userMsg];

    updateConversation(chatId, (chat) => ({
      ...chat,
      title:
        chat.messages.length === 0
          ? userMessage.slice(0, 35)
          : chat.title,
      messages: updatedMessages
    }));

    setInput("");
    setLoading(true);

    try {
      const history = currentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const reply = await sendMessageToAI(
        userMessage,
        selectedPersona,
        history
      );

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply
      };

      updateConversation(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, aiMessage]
      }));

    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `⚠️ **Something went wrong!**\n\n${error.message}`
      };

      updateConversation(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, errorMessage]
      }));

    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  // ENTER TO SEND
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((chat) =>
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`app ${theme}`}>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      {sidebarOpen && (
        <aside className="sidebar">

          <div className="brand">
            <div className="brand-icon">
              <Sparkles size={23} />
            </div>

            <h2>
              Nexa<span>AI</span>
            </h2>

            <button
              className="icon-btn mobile-close"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={19} />
            </button>
          </div>

          <button className="new-chat" onClick={handleNewChat}>
            <Plus size={18} />
            New Chat
          </button>

          <div className="search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sidebar-section">

            <p className="section-title">RECENT CHATS</p>

            {filteredConversations.length === 0 ? (
              <p className="empty-history">
                No conversations found
              </p>
            ) : (
              filteredConversations.map((chat) => (
                <div
                  key={chat.id}
                  className={`side-item ${
                    activeId === chat.id ? "active" : ""
                  }`}
                  onClick={() => selectConversation(chat)}
                >
                  <MessageSquare size={16} />

                  <span className="chat-title">
                    {chat.title}
                  </span>

                  <button
                    className="delete-chat"
                    title="Delete conversation"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(chat.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}

          </div>

          <div className="sidebar-bottom">

            <div className="profile">
              <div className="avatar">M</div>

              <div>
                <h4>Mukesh</h4>
                <p>Free Account</p>
              </div>

              <Settings size={18} />
            </div>

          </div>

        </aside>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="top-left">

            <button
              className="icon-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

            <div className="model-name">
              <Sparkles size={19} />
              NexaAI
              <span className="version">GEMINI POWERED</span>
            </div>

          </div>

          <div className="top-actions">

            {/* NEW CHAT BUTTON */}
            <button
              className="top-new-chat"
              onClick={handleNewChat}
              title="Start a new conversation"
              disabled={loading}
            >
              <Plus size={17} />
              <span>New Chat</span>
            </button>

            {/* THEME TOGGLE */}
            <button
              className="icon-btn"
              title="Toggle theme"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
            >
              {theme === "dark" ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>

            <div className="top-avatar">M</div>

          </div>

        </header>

        {/* CHAT AREA */}
        <section className="chat-area">

          {messages.length === 0 ? (

            <div className="welcome-screen">

              <div className="welcome-icon">
                <Sparkles size={38} />
              </div>

              <h1>
                Welcome to <span>NexaAI</span>
              </h1>

              <p className="welcome-description">
                Your intelligent AI assistant. Ask questions,
                explore ideas, write code, and learn something new.
              </p>

              <div className="suggestion-grid">

                {SUGGESTIONS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.title}
                      onClick={() =>
                        handleSendMessage(item.prompt)
                      }
                    >
                      <Icon size={23} />

                      <h3>{item.title}</h3>

                      <p>{item.description}</p>
                    </button>
                  );
                })}

              </div>

            </div>

          ) : (

            <div className="messages-container">

              {messages.map((message) => (

                <div
                  className={`message ${
                    message.role === "user" ? "user" : "assistant"
                  }`}
                  key={message.id}
                >

                  <div className="message-avatar">
                    {message.role === "user" ? (
                      <User size={19} />
                    ) : (
                      <Bot size={20} />
                    )}
                  </div>

                  <div className="message-content">

                    <div className="message-name">
                      {message.role === "user"
                        ? "You"
                        : "NexaAI"}
                    </div>

                    <div className="markdown-body">

                      <ReactMarkdown
                        components={{
                          pre({ children }) {
                            return <>{children}</>;
                          },
                          code: MarkdownCode
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>

                    </div>

                    <button
                      className="copy-btn"
                      onClick={() =>
                        copyMessage(message.content, message.id)
                      }
                    >
                      {copiedMessage === message.id ? (
                        <Check size={13} />
                      ) : (
                        <Copy size={13} />
                      )}

                      {copiedMessage === message.id
                        ? "Copied"
                        : "Copy response"}
                    </button>

                  </div>

                </div>

              ))}

              {loading && (
                <div className="message assistant">

                  <div className="message-avatar">
                    <Bot size={20} />
                  </div>

                  <div className="message-content">

                    <div className="message-name">
                      NexaAI
                    </div>

                    <div className="typing">
                      <span className="loader" />
                      NexaAI is thinking...
                    </div>

                  </div>

                </div>
              )}

              <div ref={chatEndRef} />

            </div>

          )}

        </section>

        {/* INPUT SECTION */}
        <div className="input-section">

          <div className="persona-select">

            <span>AI Persona:</span>

            <select
              value={persona}
              onChange={(e) => {
                const value = e.target.value;

                setPersona(value);

                if (activeId) {
                  updateConversation(activeId, (chat) => ({
                    ...chat,
                    persona: value
                  }));
                }
              }}
            >

              {PERSONAS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}

            </select>

          </div>

          <div className="input-box">

            <textarea
              ref={textareaRef}
              placeholder="Message NexaAI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />

            <button
              className="send-btn"
              disabled={!input.trim() || loading}
              onClick={() => handleSendMessage()}
              title="Send message"
            >
              <Send size={19} />
            </button>

          </div>

          <p className="footer-note">
            NexaAI can make mistakes. Verify important information.
          </p>

        </div>

      </main>

    </div>
  );
}

export default App;