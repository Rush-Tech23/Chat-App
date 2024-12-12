import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./App.css"; 


const socket = io("http://localhost:3000");

const App = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messageListRef = useRef(null);

 
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  
  useEffect(() => {
    axios
      .get("http://localhost:3000/messages")
      .then((res) => {
        setMessages(res.data);
        scrollToBottom();
      })
      .catch((err) => console.error("Error fetching messages:", err));

    socket.on("receiveMessage", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message) return;

    const newMessage = { sender: "rushi", text: message };

    socket.emit("sendMessage", newMessage);
    setMessage("");

    axios.post("http://localhost:3000/messages", newMessage).catch((err) => {
      console.error("Error sending message:", err);
    });
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="chat-header">Chat App</div>
        <div className="message-list" ref={messageListRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.sender === "rushi" ? "sent-message" : "received-message"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <form className="message-form" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-input"
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
