import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./LiveChat.css";

function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newMessage, setNewMessage] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [userDetails, setUserDetails] = useState({ email: "", phone: "" });
  const [awaitingInput, setAwaitingInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    handleBotResponse(input);
    setInput("");
  };

  const handleBotResponse = (userInput) => {
    if (awaitingInput === "email") {
      setUserDetails((prev) => ({ ...prev, email: userInput }));
      setMessages((prev) => [
        ...prev,
        {
          text: "Got it! Now, please provide your phone number.",
          sender: "bot",
        },
      ]);
      setAwaitingInput("phone");
      return;
    }

    if (awaitingInput === "phone") {
      setUserDetails((prev) => ({ ...prev, phone: userInput }));
      setMessages((prev) => [
        ...prev,
        { text: "Thanks! How can I assist you today?", sender: "bot" },
      ]);
      setAwaitingInput("");
      return;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Hello! Can I have your email?", sender: "bot" },
      ]);
      setAwaitingInput("email");
    }, 1000);
  };

  return (
    <div className="chat-container">
      {isOpen && (
        <div className="chat-box">
          <div className="chat-header">
            <span>Live Chat</span>
            <button onClick={() => setIsOpen(false)} className="close-btn">
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="send-btn">
              <i className="bi bi-send"></i>
            </button>
          </div>
        </div>
      )}
      {showTooltip && !isOpen && (
        <div className="chat-tooltip">Welcome to MindStocs! 👋</div>
      )}
      <button
        className="chat-button"
        onClick={() => {
          setIsOpen(!isOpen);
          setNewMessage(false);
          setShowTooltip(false);
        }}
      >
        <i className="bi bi-chat-dots"></i>
        {newMessage && <span className="chat-notification">1</span>}
      </button>
    </div>
  );
}

export default LiveChat;
