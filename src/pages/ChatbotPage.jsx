import React, { useState } from "react";
import chatbotImage from "../assets/images/chatbot.png";
import "./ChatbotPage.css";

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  //API호출
  const callGeminiAPI = async (userMessage) => {
    const API_KEY = ""; //AIzaSyAJ_nUzuKky57CuS36IUVopQp6qzR7POOE
    console.log("=== API 키 테스트 시작 ===");
    console.log("API 키:", API_KEY);
    const API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage,
                },
              ],
            },
          ],
        }),
      });

      console.log("응답 상태:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API 에러 응답:", errorData);

        const errorMessage = errorData.error?.message || "알 수 없는 에러";
        throw new Error(`${response.status}: ${errorMessage}`);
      }

      const data = await response.json();
      console.log("성공 응답:", data);

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error("예상과 다른 응답 구조:", data);
        return "죄송합니다. 응답을 처리할 수 없습니다.";
      }
    } catch (error) {
      console.error("API 호출 에러:", error);
      return `오류 발생: ${error.message}`;
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === "") return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setIsLoading(true);

    const botResponse = await callGeminiAPI(userMessage);
    setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
    setIsLoading(false);
  };

  const handleQuickSelect = async (type) => {
    let message = "";
    switch (type) {
      case "exercise":
        message = "오늘의 운동을 추천해줘";
        break;
      case "food":
        message = "건강한 식단을 추천해줘";
        break;
      case "plan":
        message = "계획 수립을 도와줘";
        break;
      default:
        return;
    }
    setMessages((prev) => [...prev, { type: "user", text: message }]);
    setIsLoading(true);

    const botResponse = await callGeminiAPI(message);
    setMessages((prev) => [...prev, { type: "bot", text: botResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="chatbot-container">
      <div className="main-content">
        {messages.length === 0 ? (
          <>
            <div className="welcome-section">
              <h1 className="title">안녕하세요!</h1>
              <p className="subtitle">어떻게 도와드릴까요?</p>
            </div>

            <div className="bot-image-container">
              <img
                src={chatbotImage}
                alt="AI Assistant"
                className="bot-image"
              />
            </div>

            <div className="quick-actions">
              <button
                className="action-btn"
                onClick={() => handleQuickSelect("exercise")}
              >
                <span className="action-icon">🏋️</span>
                <span className="action-text">운동 추천</span>
              </button>

              <button
                className="action-btn highlighted"
                onClick={() => handleQuickSelect("food")}
              >
                <span className="action-icon">🍗</span>
                <span className="action-text">식단 추천</span>
              </button>

              <button
                className="action-btn"
                onClick={() => handleQuickSelect("plan")}
              >
                <span className="action-icon">📅</span>
                <span className="action-text">계획 수립</span>
              </button>
            </div>
          </>
        ) : (
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.type === "user" ? "user-message" : "bot-message"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message loading">
                <span className="loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          className="message-input"
          placeholder="무엇이든 물어보세요"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>
          <span className="send-icon">➤</span>
        </button>
      </div>
    </div>
  );
};

export default ChatbotPage;
