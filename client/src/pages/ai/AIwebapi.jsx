import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './assistant.css';
import axios from 'axios';

const FaceEmotionDetection = () => {
  const videoRef = useRef(null);
  const [emotion, setEmotion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null); // To store the selected voice
  const speechSynthesisRef = useRef(window.speechSynthesis); // Reference to the Speech Synthesis API

  // Load models required for face detection and emotion analysis
  const loadModels = async () => {
    console.log("Loading face-api models...");
    const MODEL_URL = './models'; // Ensure models are served from the public folder
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    console.log("Models loaded successfully.");
  };

  // Preload voices and set the selected voice once
  const preloadVoices = () => {
    console.log("Preloading voices...");
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synth.getVoices();
      const selected = voices.find((voice) => voice.name === 'Google US English') || voices[0];
      setSelectedVoice(selected); // Store the selected voice in state
      console.log("Selected voice:", selected.name);
    };

    if (synth.getVoices().length > 0) {
      loadVoices();
    } else {
      synth.addEventListener('voiceschanged', loadVoices, { once: true });
    }
  };

  const startVideo = () => {
    console.log("Accessing webcam...");
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Webcam access granted.");
        }
      })
      .catch((err) => console.error('Error accessing webcam:', err));
  };

  const detectEmotions = async () => {
    const video = videoRef.current;
    if (video && faceapi.nets.tinyFaceDetector.params) {
      //console.log("Detecting emotions...");
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0 && detections[0].expressions) {
        const expressions = detections[0].expressions;
        const maxEmotion = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );
        setEmotion(maxEmotion);
        //console.log("Detected emotion:", maxEmotion);
      } else {
        setEmotion('No emotion detected');
        //console.log("No emotions detected.");
      }
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    console.log("Initializing speech recognition...");
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1][0].transcript;
        setTranscript(result);
        console.log("Transcript:", result);
      };

      recognition.onend = () => {
        setIsRecording(false);
        console.log("Speech recognition ended.");
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognition;
    } else {
      console.error('SpeechRecognition API not supported.');
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      console.log("Starting recording...");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      console.log("Stopping recording...");
      recognitionRef.current.stop();
      setTimeout(() => {
        console.log("Generating AI response...");
        generateAiResponse(transcript, emotion);
      }, 500);
      setIsRecording(false);
    }
  };

  const generateAiResponse = async (inputMessage, videoEmotion) => {
    const maxRetries = 3; // Maximum number of retry attempts
    let attempt = 0;
    let responseData = null;
  
    while (attempt < maxRetries) {
      try {
        setIsLoading(true);
        console.log("Sending request to AI with message:", inputMessage, "and emotion:", videoEmotion);
  
        const response = await fetch('http://localhost:3001/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            emotion: videoEmotion,
          }),
        });
  
        if (response.ok) {
          responseData = await response.json();
          const result = responseData.response;
          setResponse(result);
          console.log("AI response received:", result);
          speakResponse(result); // Speak the response immediately
          break; // Exit the loop if the response is successful
        } else {
          if (response.status === 500) {
            console.log("Server error (500). Retrying...");
            attempt++;
            // Optionally, you can wait for a short period before retrying
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          } else {
            setError('Failed to fetch response from AI');
            console.log("Error fetching AI response:", response.status);
            break; // Exit the loop for other errors
          }
        }
      } catch (error) {
        setError('An error occurred while fetching the response.');
        console.error("Fetch error:", error);
        break; // Exit the loop on network errors
      } finally {
        setIsLoading(false);
        console.log("Loading state:", isLoading);
      }
    }
  
    if (attempt === maxRetries) {
      console.log("Max retries reached. Giving up.");
    }
  };
  

  // Speak the response directly
  const speakResponse = (text) => {
    if (!selectedVoice) {
      console.error("No voice selected!");
      return; // Don't try to speak if no voice is selected
    }
  
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.onend = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.rate = 1;
        console.log("Speaking response:", text);
        speechSynthesisRef.current.speak(utterance);
      };
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 1;
    console.log("Speaking response:", text);
    speechSynthesisRef.current.speak(utterance);
  };

  useEffect(() => {
    console.log("Component mounted. Loading models and starting video...");
    // Load models and start the video when the component mounts
    loadModels().then(startVideo);
    initializeSpeechRecognition();
    preloadVoices(); // Preload voices at the start

    const emotionInterval = setInterval(() => {
      detectEmotions();
    }, 100); // Adjust the interval as needed for performance

    return () => {
      clearInterval(emotionInterval);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Stop any ongoing speech synthesis when the component unmounts
      speechSynthesisRef.current.cancel();
      console.log("Component unmounted. Cleanup done.");
    };
  }, []);

  return (
    <div className="container">
      <div className="main-content">
        {/* Left Section: Video */}
        <div className="left-section">
          <div className="video-container">
            <video ref={videoRef} autoPlay muted width="100%" height="auto" />
            <div className="transcript-caption">{transcript}</div>
          </div>
        </div>

        {/* Right Section: Jelly Circle */}
        <div className="right-section">
          <div className="circle-container">
            {isLoading ? (
              <div className="circle">
                <div className="container10">
                  <div className="line layer-1"></div>
                  <div className="line layer-2"></div>
                  <div className="line layer-3"></div>
                  <div className="line layer-4"></div>
                  <div className="line layer-5"></div>
                </div>
              </div>
            ) : (
              <div className="circle">
                <div className="container10">
                  <div className="line layer-1"></div>
                  <div className="line layer-2"></div>
                  <div className="line layer-3"></div>
                  <div className="line layer-4"></div>
                  <div className="line layer-5"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Bottom Controls: Start and Stop Recording Buttons */}
      <div className="controls">
        <button onClick={startRecording} disabled={isRecording}>
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
    </div>
  );
};

export default FaceEmotionDetection;
