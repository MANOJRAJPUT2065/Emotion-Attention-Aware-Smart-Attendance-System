import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './quiz.css'; // Import the CSS file for styling

// Sample questions
const questions = [
  { question: "Do you sometimes feel like life is not worth living, or have you had thoughts of ending your life?", correctAnswer: "Yes" },
  { question: "Do you often wish you could escape from everyone and everything, or feel an urge to disappear?", correctAnswer: "Yes" },
  { question: "Have you found yourself withdrawing from close relationships, even with family or friends?", correctAnswer: "Yes" },
  { question: "Do you feel overwhelmed by feelings of hopelessness or believe that things will never improve?", correctAnswer: "Yes" },
];

const Quiz = () => {
  const videoRef = useRef(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [emotion, setEmotion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [userAnswers, setUserAnswers] = useState([]);
  const recognitionRef = useRef(null);

  const loadModels = async () => {
    const MODEL_URL = './models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });
  };

  const detectEmotions = async () => {
    const video = videoRef.current;
    if (video && faceapi.nets.tinyFaceDetector.params) {
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
      } else {
        setEmotion("neutral");
      }
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1][0].transcript;
        setTranscript(result);
      };

      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event) => console.error("Speech recognition error:", event.error);

      recognitionRef.current = recognition;
    } else {
      console.error("SpeechRecognition API not supported.");
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      handleAnswer(transcript.trim().toLowerCase());
      setIsRecording(false);
    }
  };

  const handleAnswer = (transcript) => {
    const answer = transcript.toLowerCase();

    let extractedAnswer = "";
    if (answer.includes("yes")) {
        extractedAnswer = "yes";
    } else if (answer.includes("no")) {
        extractedAnswer = "no";
    }

    console.log("Transcript: " + transcript);
    console.log("Extracted Answer: " + extractedAnswer);

    if (extractedAnswer === questions[currentQuestionIndex].correctAnswer.toLowerCase()) {
        setScore(score + 1);
    }

    // Store the user's answer
    setUserAnswers(prevAnswers => [
      ...prevAnswers,
      { question: questions[currentQuestionIndex].question, answer: extractedAnswer }
    ]);

    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < questions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
    } else {
        setShowScore(true);
        sendResultsToBackend();
    }
  };

  const sendResultsToBackend = async () => {
    const response = await fetch('http://localhost:3001/quizScore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions: userAnswers.map(answer => answer.question),
        answers: userAnswers.map(answer => answer.answer),
        score: score,
      }),
    });

    const data = await response.json();
    setResponseMessage(data.response || "Thank you for completing the quiz.");
    fetchAndPlayAudio(data.response || "Thank you for completing the quiz.")
  };

  const fetchAndPlayAudio = async (text) => {
    try {
        //sk_87eb9c5962fdc151f5573ef517af66363ae1c253639a2071
        //sk_177725c1e3a1738fe6e81d68ac72339a1df2e67ae46051a3
        const voiceId = 'cgSgspJ2msm6clMCkdW9';
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
        const apiKey = 'sk_87eb9c5962fdc151f5573ef517af66363ae1c253639a2071';

        const data = { text, voice_settings: { stability: 0.1, similarity_boost: 0.3 } };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
            body: JSON.stringify(data),
        });

        if (response.body) {
            const reader = response.body.getReader();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBufferQueue = [];
            let isPlaying = false;
            let isFirstPlayback = true;
            const MIN_BUFFERED_CHUNKS = 5;

            const processChunk = async () => {
                const { done, value } = await reader.read();
                if (done) return;

                try {
                    const audioBuffer = await audioContext.decodeAudioData(value.buffer);
                    audioBufferQueue.push(audioBuffer);

                    if (isFirstPlayback && audioBufferQueue.length >= MIN_BUFFERED_CHUNKS && !isPlaying) {
                        isFirstPlayback = false;
                        playNextChunk();
                    } else if (!isPlaying) {
                        playNextChunk();
                    }
                } catch (err) {
                    console.error("Error decoding audio chunk:", err);
                }

                processChunk();
            };

            const playNextChunk = () => {
                if (audioBufferQueue.length === 0) {
                    isPlaying = false;
                    return;
                }

                isPlaying = true;
                const nextBuffer = audioBufferQueue.shift();
                const chunkSource = audioContext.createBufferSource();
                chunkSource.buffer = nextBuffer;
                chunkSource.connect(audioContext.destination);
                chunkSource.onended = () => {
                    isPlaying = false;
                    playNextChunk();
                };
                chunkSource.start();
            };

            processChunk();
        }
    } catch (err) {
        console.error("Error fetching or playing audio:", err);
    }
};


  useEffect(() => {
    loadModels().then(startVideo).catch(err => console.error("Error starting video:", err));
    initializeSpeechRecognition();

    const emotionInterval = setInterval(() => {
      detectEmotions().catch(err => console.error("Error detecting emotions:", err));
    }, 500);

    return () => {
      clearInterval(emotionInterval);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return (
    <div className="container">
      {showScore ? (
        <div className="score-section">
          <div>You scored {score} out of {questions.length}</div>
          <div className="response-message">{responseMessage}</div>
            <div>
            <a href="https://police-map-test.vercel.app/" target="_blank" rel="noopener noreferrer">
              <button className="redirect-button">Go to Helpful Resource</button>
            </a>
        
            <a href="http://localhost:3000/assist">
              <button className="redirect-button">Try Zen AI</button>
            </a>
            </div>
            
        </div>
      ) : (
        <div className="quiz-box">
          <div className="question-section">
            <div className="question-count">
              <span>Question {currentQuestionIndex + 1}</span>/{questions.length}
            </div>
            <div className="question-text">{questions[currentQuestionIndex].question}</div>
          </div>
          <hr className="divider" />
          <div className="video-container">
            <video ref={videoRef} autoPlay muted width="100%" height="auto" />
          </div>
          <div className="transcript-caption">Transcript: {transcript}</div>
          <div className="answer-section">
            <button className="answer-button" onClick={startRecording} disabled={isRecording}>
              {isRecording ? 'Recording...' : 'Click to Answer'}
            </button>
            <button className="answer-button" onClick={stopRecording} disabled={!isRecording}>
              Submit Answer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
