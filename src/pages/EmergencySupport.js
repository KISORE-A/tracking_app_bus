import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function EmergencySupport() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get("type") || "General";
  const number = queryParams.get("number") || "100";

  const [callStatus, setCallStatus] = useState("ringing");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");

  const audioRef = useRef(null);
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() =>{
    // Play ringing sound
    playRingingSound();

    // After 6 seconds, answer the call
    const answerTimer = setTimeout(() =>{
      setCallStatus("connected");
      stopRingingSound();
      speakInitialResponse();
    }, 6000);

    return () =>{
      clearTimeout(answerTimer);
      stopRingingSound();
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [type]);

  const playRingingSound = () =>{
    // Prevent multiple audio contexts
    if (audioRef.current && audioRef.current.isPlaying) {
      console.log("Audio already playing, skipping");
      return;
    }

    // Create audio context for ringing sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.3;
    let isPlaying = true;

    const playRing = () =>{
      if (!isPlaying) return;
      // Create a new oscillator for each ring
      const oscillator = audioContext.createOscillator();
      oscillator.connect(gainNode);
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = "sine";
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);

      // Schedule next ring
      setTimeout(() =>{
        if (isPlaying) {
          playRing();
        }
      }, 1000);
    };

    audioRef.current = {
      audioContext,
      isPlaying: true,
      stopRinging: () =>{
        isPlaying = false;
      },
    };

    playRing();
  };

  const stopRingingSound = () =>{
    if (audioRef.current) {
      audioRef.current.isPlaying = false;
      if (audioRef.current.stopRinging) {
        audioRef.current.stopRinging();
      }
      try {
        if (audioRef.current.audioContext && audioRef.current.audioContext.state !== "closed") {
          audioRef.current.audioContext.close();
        }
      } catch (e) {
        // Ignore audio context close errors
      }
    }
  };

  const speakInitialResponse = () =>{
    let initialMessage = "";
    if (type === "Police") {
      initialMessage =
        "Hello sir or madam, this is police emergency services. What is the problem? Please describe the situation.";
    } else {
      initialMessage =
        "Hello sir or madam, this is hospital emergency services. Where is the location? What happened to them?";
    }
    setMessages([{ sender: type, text: initialMessage }]);
    speakText(initialMessage);

    // Start listening after initial response
    setTimeout(() =>{
      startListening();
    }, 3000);
  };

  const speakText = (text) =>{
    console.log("Speaking:", text); // Debug log
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      // Small delay to ensure cancellation is complete
      setTimeout(() =>{
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = "en-US";
        utterance.onstart = () =>{ console.log("Speech started"); };
        utterance.onend = () =>{ console.log("Speech ended"); };
        utterance.onerror = (event) =>{ console.error("Speech error:", event); };
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }, 100);
    } else {
      console.error("Speech synthesis not supported");
      alert("Voice response not supported in your browser");
    }
  };

  const startListening = () =>{
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let silenceTimer = null;

    recognition.onstart = () =>{
      setIsListening(true);
      setUserSpeech(" Listening... Speak now!");
      finalTranscript = "";
    };

    recognition.onresult = (event) =>{
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setUserSpeech(finalTranscript + interimTranscript || " Listening...");

      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }

      if (finalTranscript.trim()) {
        silenceTimer = setTimeout(() =>{
          recognition.stop();
        }, 2000);
      }
    };

    recognition.onerror = (event) =>{
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "no-speech") {
        setUserSpeech("No speech detected. Click Speak and try again.");
        setTimeout(() =>setUserSpeech(""), 3000);
      } else if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
        setUserSpeech("");
      } else if (event.error === "aborted") {
        setUserSpeech("");
      } else {
        setUserSpeech("Error occurred. Click Speak to try again.");
        setTimeout(() =>setUserSpeech(""), 3000);
      }
    };

    recognition.onend = () =>{
      setIsListening(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      const finalText = finalTranscript.trim();
      console.log("Final transcript:", finalText);
      if (finalText) {
        setMessages((prev) =>[...prev, { sender: "You", text: finalText }]);
        setTimeout(() =>{
          const response = generateResponse(finalText);
          console.log("Generated response:", response);
          setMessages((prev) =>[...prev, { sender: type, text: response }]);
          speakText(response);
          setUserSpeech("");
          setTimeout(() =>{
            if (callStatus === "connected") {
              startListening();
            }
          }, 3000);
        }, 500);
      } else {
        console.log("No speech detected, restarting listening");
        setUserSpeech("");
        setTimeout(() =>{
          if (callStatus === "connected") {
            startListening();
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
      alert("Failed to start speech recognition. Please try clicking the Speak button again.");
    }
  };

  const generateResponse = (userInput) =>{
    const input = userInput.toLowerCase();
    if (type === "Police") {
      if (input.includes("accident") || input.includes("crash") || input.includes("collision")) {
        return "Understood. Is anyone injured? We are dispatching a unit to your location immediately.";
      } else if (input.includes("theft") || input.includes("stolen") || input.includes("robbery")) {
        return "I understand. Can you describe the suspect? Are you in a safe location right now?";
      } else if (input.includes("emergency") || input.includes("help") || input.includes("urgent")) {
        return "Stay calm. Help is on the way. Can you tell me your exact location?";
      } else if (input.includes("location") || input.includes("address") || input.includes("place")) {
        return "Thank you for the location. Officers are being dispatched now. Please stay on the line.";
      } else if (input.includes("yes") || input.includes("yeah")) {
        return "Understood. Please provide more details so we can assist you better.";
      } else if (input.includes("no")) {
        return "Alright. Is there anything else you need to report?";
      }
      return "I understand. Can you provide your exact location and any additional details?";
    }

    if (input.includes("accident") || input.includes("injured") || input.includes("hurt")) {
      return "Understood. How many people are injured? Is anyone unconscious or bleeding heavily?";
    } else if (input.includes("breathing") || input.includes("breath") || input.includes("chest pain")) {
      return "This is critical. Keep the patient calm. Ambulance is on the way. Is the patient conscious?";
    } else if (input.includes("location") || input.includes("address") || input.includes("place")) {
      return "Thank you for the location. Ambulance is being dispatched immediately. Stay with the patient.";
    } else if (input.includes("yes") || input.includes("yeah") || input.includes("conscious")) {
      return "Good. Keep them comfortable and don't move them unless absolutely necessary. Help is coming.";
    } else if (input.includes("no") || input.includes("unconscious") || input.includes("not breathing")) {
      return "This is an emergency. Start CPR if you know how. Ambulance is on the way. Stay on the line.";
    } else if (input.includes("bleeding") || input.includes("blood")) {
      return "Apply pressure to the wound with a clean cloth. Don't remove it. Ambulance is coming.";
    }

    return "Please tell me the exact location and describe the patient's condition in detail.";
  };

  const endCall = () =>{
    setCallStatus("ended");
    stopRingingSound();
    if (speechRef.current) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTimeout(() =>{
      navigate(-1);
    }, 500);
  };

  return (
    <div className="emergency-call-overlay">
      <div className="call-container">
        <div className="call-avatar">{type === "Police" ? "" : ""}</div>
        <h2 className="calling-text">
          {callStatus === "ringing" && "Calling..."}
          {callStatus === "connected" && "Connected"}
          {callStatus === "ended" && "Call Ended"}
        </h2>
        <h1 className="emergency-type">{type}</h1>
        <p className="emergency-number">{number}</p>

        {callStatus === "ringing" && (
          <div className="ringing-indicator">
            <div className="ring-pulse"></div>
            <p className="status-text">Connecting to emergency services...</p>
          </div>
        )}

        {callStatus === "connected" && (
          <div className="conversation-container">
            <div className="messages-list">
              {messages.map((msg, idx) =>(
                <div
                  key={idx}
                  className={`message ${msg.sender === "You" ? "user-message" : "service-message"}`}
                >
                  <strong>{msg.sender}:</strong>
                  {msg.text}
                </div>
              ))}
            </div>

            {isListening && (
              <div className="listening-indicator">
                <div className="voice-indicator">
                  <span className="wave"></span>
                  <span className="wave"></span>
                  <span className="wave"></span>
                </div>
                <p className="listening-text">{userSpeech}</p>
              </div>
            )}

            <div className="input-container">
              <input
                type="text"
                placeholder="Type your message or speak..."
                className="text-input"
                onKeyPress={(e) =>{
                  if (e.key === "Enter" && e.target.value.trim()) {
                    const text = e.target.value.trim();
                    setMessages((prev) =>[...prev, { sender: "You", text }]);
                    e.target.value = "";
                    setTimeout(() =>{
                      const response = generateResponse(text);
                      setMessages((prev) =>[...prev, { sender: type, text: response }]);
                      speakText(response);
                    }, 500);
                  }
                }}
              />
              <button
                className="send-btn"
                onClick={(e) =>{
                  const input = e.target.previousSibling;
                  if (input.value.trim()) {
                    const text = input.value.trim();
                    setMessages((prev) =>[...prev, { sender: "You", text }]);
                    input.value = "";
                    setTimeout(() =>{
                      const response = generateResponse(text);
                      setMessages((prev) =>[...prev, { sender: type, text: response }]);
                      speakText(response);
                    }, 500);
                  }
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        <div className="call-actions">
          <button className="end-call-btn" onClick={endCall}>
            <span className="icon"></span>
          </button>
        </div>
      </div>
      <style>{` .emergency-call-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: linear-gradient(135deg, #1a1c23 0%, #2d3748 100%); display: flex; align-items: center; justify-content: center; z-index: 9999; color: white; font-family: 'Inter', sans-serif; overflow-y: auto; } .call-container { text-align: center; animation: fadeIn 0.5s ease-out; max-width: 600px; width: 90%; padding: 20px; } .call-avatar { font-size: 80px; margin-bottom: 20px; animation: pulse 2s infinite; } .calling-text { font-size: 1.2rem; opacity: 0.8; font-weight: 400; margin-bottom: 10px; letter-spacing: 2px; text-transform: uppercase; } .emergency-type { font-size: 2.5rem; margin-bottom: 5px; } .emergency-number { font-size: 1.5rem; opacity: 0.9; margin-bottom: 30px; } .ringing-indicator { margin: 20px 0; } .ring-pulse { width: 60px; height: 60px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); margin: 0 auto 15px; animation: ringPulse 1.5s infinite; } .status-text { font-size: 0.9rem; opacity: 0.7; font-style: italic; } .conversation-container { margin: 20px 0; max-height: 400px; overflow-y: auto; } .messages-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; } .message { background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 12px 16px; text-align: left; animation: slideUp 0.3s ease-out; } .user-message { background: rgba(66, 153, 225, 0.2); border-left: 4px solid #4299e1; margin-left: 20px; } .service-message { background: rgba(255, 255, 255, 0.1); border-left: 4px solid #48bb78; margin-right: 20px; } .message strong { display: block; margin-bottom: 4px; font-size: 0.85rem; opacity: 0.8; } .listening-indicator { margin: 20px 0; padding: 15px; background: rgba(66, 153, 225, 0.2); border-radius: 12px; border: 2px solid #4299e1; } .listening-text { margin-top: 10px; font-size: 0.9rem; font-style: italic; color: #4299e1; } .voice-indicator { display: flex; justify-content: center; gap: 5px; height: 30px; align-items: center; } .wave { width: 4px; height: 15px; background: #4299e1; border-radius: 2px; animation: waveAnimation 1s infinite ease-in-out; } .wave:nth-child(2) { .wave:nth-child(3) { animation-delay: 0.4s; } .input-container { display: flex; gap: 10px; margin-top: 15px; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; } .text-input { flex: 1; padding: 12px 16px; border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; font-size: 1rem; font-family: 'Inter', sans-serif; outline: none; transition: all 0.3s; } .text-input:focus { border-color: #4299e1; background: rgba(255, 255, 255, 0.15); } .text-input::placeholder { color: rgba(255, 255, 255, 0.5); } .send-btn { padding: 12px 24px; background: #4299e1; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; } .send-btn:hover { background: #3182ce; transform: scale(1.05); } .send-btn:active { transform: scale(0.95); } .speak-btn { background: #4299e1; color: white; border: none; padding: 12px 24px; border-radius: 25px; font-size: 1rem; cursor: pointer; transition: all 0.2s; margin: 10px 0; } .speak-btn:hover { background: #3182ce; transform: scale(1.05); } .end-call-btn { width: 80px; height: 80px; border-radius: 50%; background: #e53e3e; border: none; color: white; font-size: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background 0.2s; margin: 30px auto 0; } .end-call-btn:hover { transform: scale(1.1); background: #c53030; } .end-call-btn .icon { transform: rotate(135deg); } @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } } @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes ringPulse { 0% { transform: scale(0.8); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(0.8); opacity: 1; } } @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes waveAnimation { 0%, 100% { height: 15px; } 50% { height: 25px; } } `}</style>
    </div>
  );
}
