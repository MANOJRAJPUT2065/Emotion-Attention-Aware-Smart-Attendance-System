import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './assistant.css';
import axios from 'axios';

const FaceEmotionDetection = () => {
    const videoRef = useRef(null);
    const [emotion, setEmotion] = useState("");
    const [transcript, setTranscript] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const [response, setResponse] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [initialQuestionsAsked, setInitialQuestionsAsked] = useState(false);
    const [answers, setAnswers] = useState({});

    const questions = [
        "Hi there Manoj Singh this Side, I'm glad you're here. Before we begin, could you share your name with me? Also, how have you been feeling emotionally lately? I'm here to listen and support you."
    ];

    let currentQuestionIndex = 0;

    const loadModels = async () => {
        try {
            const MODEL_URL = './models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);
        } catch (err) {
            console.error("Error loading face detection models:", err);
            setError("Error loading face detection models");
        }
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
                setError("Error accessing webcam");
            });
    };

    const detectEmotions = async () => {
        const video = videoRef.current;
        if (video && faceapi.nets.tinyFaceDetector.params) {
            try {
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
            } catch (err) {
                console.error("Error during emotion detection:", err);
                setError("Error during emotion detection");
            }
        }
    };

    const initializeSpeechRecognition = () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.interimResults = true;
                recognition.continuous = true;

                recognition.onresult = event => {
                    const result = event.results[event.results.length - 1][0].transcript;
                    setTranscript(result);
                };

                recognition.onend = () => setIsRecording(false);
                recognition.onerror = event => console.error("Speech recognition error:", event.error);

                recognitionRef.current = recognition;
            } else {
                console.error("SpeechRecognition API not supported.");
                setError("SpeechRecognition API not supported");
            }
        } catch (err) {
            console.error("Error initializing speech recognition:", err);
            setError("Error initializing speech recognition");
        }
    };

    const startRecording = () => {
        try {
            if (recognitionRef.current) {
                recognitionRef.current.start();
                setIsRecording(true);
            }
        } catch (err) {
            console.error("Error starting speech recognition:", err);
            setError("Error starting speech recognition");
        }
    };

    const stopRecording = () => {
        try {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                if (initialQuestionsAsked) {
                    // If asking questions, log response and go to next question
                    storeAnswer(transcript);
                } else {
                    // Regular conversation
                    setTimeout(() => generateAiResponse(transcript, emotion), 500);
                }
                setIsRecording(false);
            }
        } catch (err) {
            console.error("Error stopping speech recognition:", err);
            setError("Error stopping speech recognition");
        }
    };

    const storeAnswer = (answer) => {
        setAnswers(prev => ({ ...prev, [`question_${currentQuestionIndex}`]: answer }));
        currentQuestionIndex += 1;

        if (currentQuestionIndex < questions.length) {
            // Ask the next question
            fetchAndPlayAudio(questions[currentQuestionIndex]);
        } else {
            // All questions asked, mark as done
            setInitialQuestionsAsked(true);
        }
    };

    const askInitialQuestions = () => {
        currentQuestionIndex = 0;
        fetchAndPlayAudio(questions[currentQuestionIndex]);
    };

    const generateAiResponse = async (inputMessage, videoEmotion) => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputMessage, emotion: videoEmotion }),
            });

            console.log(response);

            if (response.ok) {
                const data = await response.json();
                setResponse(data.response);
                console.log("AI response : " + data.response);
                fetchAndPlayAudio(data.response);
            } else {
                setError("Failed to fetch response from AI");
                console.error("AI response fetch failed:", response.statusText);
            }
        } catch (err) {
            setError("An error occurred while fetching the AI response.");
            console.error("Error during AI response fetch:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadModels().then(startVideo).catch(err => console.error("Error starting video:", err));
        initializeSpeechRecognition();

        const emotionInterval = setInterval(() => {
            detectEmotions().catch(err => console.error("Error detecting emotions:", err));
        }, 500);

        // Ask initial questions with a 3-second delay when the page loads
        if (!initialQuestionsAsked) {
            setTimeout(() => {
                askInitialQuestions();
            }, 3000); // 3000 milliseconds = 3 seconds
        }


        return () => {
            clearInterval(emotionInterval);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);


    const fetchAndPlayAudio = async (text) => {
        try {
            //sk_177725c1e3a1738fe6e81d68ac72339a1df2e67ae46051a3
            //sk_87eb9c5962fdc151f5573ef517af66363ae1c253639a2071
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
            setError("Error fetching or playing audio");
        }
    };


    return (
        <div className="container">
            <div className="main-content">
                {/* Left Section: Video */}
                <div className="left-section">
                    <div className="video-container">
                        {/* <div className="emotion-caption">{"Facial Emotion : "+emotion}</div> Display emotion */}
                        <video ref={videoRef} autoPlay muted width="100%" height="auto" />
                        <div className="transcript-caption">{transcript}</div>
                    </div>
                </div>

                {/* Right Section: Jelly Circle and AI Response */}
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

                    {/* AI Response Section */}
                    <div className="ai-response">
                        <h3>AI Response</h3>
                        <p>{response || questions[0]}</p>
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
