import React, { useState, useEffect, useRef } from 'react';

const Ai = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioEmotions, setAudioEmotions] = useState(null);
  const [videoEmotion, setVideoEmotion] = useState(null);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState('');


  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const speechBufferRef = useRef('');
  const isSpeakingRef = useRef(false);

  // Starts the recording
  const startRecording = () => {
    setIsRecording(true);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
      console.log('Recording started');
    }
  };

  // Stops the recording
  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      console.log('Recording stopped');
    }
  };

  // Generates AI response using the prompt with only current input
  // Generates AI response using the prompt with conversation history
  const generateAiResponse = async (inputMessage,audio_emotions,videoEmotion) => {
    try {

      const highestAudioEmotion = audio_emotions.reduce((maxEmotion, currentEmotion) => {
        return currentEmotion.score > maxEmotion.score ? currentEmotion : maxEmotion;
      }, audio_emotions[0]);
      
      // Format the highest audio emotion
      const formattedHighestAudioEmotion = `${highestAudioEmotion.label}: ${highestAudioEmotion.score.toFixed(2)}`;


      const prompt = `
      You are a caring and empathetic AI assistant. Respond based on the following audio emotions, and video emotions extracted:

      Probable Audio emotion:
      [${formattedHighestAudioEmotion}]

      Probable Video emotion:
      [${videoEmotion}]

      Text from video analysis (possibly seeking help for mental peace):
      "${inputMessage}"

      AI:
    `;

    console.log(prompt);
    
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.1:latest',
          prompt: prompt,
        }),
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let result = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  result += parsed.response;
                  setResponse(result);
                  addToSpeechBuffer(parsed.response);
                }
              } catch (err) {
                console.error('Error parsing JSON', err);
              }
            }
          }

          buffer = lines[lines.length - 1];
        }

        if (buffer) {
          try {
            const parsed = JSON.parse(buffer);
            if (parsed.response) {
              result += parsed.response;
              setResponse(result);
              addToSpeechBuffer(parsed.response);
            }
          } catch (err) {
            console.error('Error parsing final JSON', err);
          }
        }


      } else {
        setError('Failed to fetch response from AI');
      }
    } catch (error) {
      setError('An error occurred while fetching the response.');
    }
  };

  // Add text to the speech buffer and check if there are enough sentences to speak
const addToSpeechBuffer = (text) => {
  speechBufferRef.current += text;

  // Don't start speaking unless we have at least one full sentence or meaningful chunk
  if (!isSpeakingRef.current && hasCompleteSentence(speechBufferRef.current)) {
    speakFromBuffer();
  }
};

// Helper function to check if the buffer has a complete sentence to speak
const hasCompleteSentence = (text) => {
  const sentenceRegex = /[.!?]+/g;  // A complete sentence ends with punctuation
  return sentenceRegex.test(text);
};

// Speak from buffer when there is enough content
const speakFromBuffer = () => {
  if (speechBufferRef.current.length > 0 && hasCompleteSentence(speechBufferRef.current)) {
    isSpeakingRef.current = true;

    // Extract the first complete sentence from the buffer
    const sentenceToSpeak = extractFirstCompleteSentence(speechBufferRef.current);
    speechBufferRef.current = speechBufferRef.current.slice(sentenceToSpeak.length).trim();

    utteranceRef.current = new SpeechSynthesisUtterance(sentenceToSpeak);
    utteranceRef.current.rate = 1.3;

    utteranceRef.current.onend = () => {
      isSpeakingRef.current = false;
      speakFromBuffer(); // Continue speaking the remaining text if any
    };

    speechSynthesisRef.current.speak(utteranceRef.current);
  } else {
    isSpeakingRef.current = false; // Stop if no complete sentence is ready to speak
  }
};

// Helper function to extract the first complete sentence from the buffer
const extractFirstCompleteSentence = (text) => {
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const match = text.match(sentenceRegex);
  return match ? match[0].trim() : text.trim();
};

  const stopSpeaking = () => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    isSpeakingRef.current = false;
    speechBufferRef.current = '';
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Sends recorded data to server
  const sendToServer = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('File uploaded successfully');
        setTranscript(data.transcript);
        setAudioEmotions(data.audio_emotions);
        setVideoEmotion(data.dominant_video_emotion);

        generateAiResponse(data.transcript,data.audio_emotions,data.dominant_video_emotion);
      } else {
        setMessage('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Error uploading file');
    }
  };

  useEffect(() => {
    const startMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const options = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
        ];

        let mimeType = options.find((type) => MediaRecorder.isTypeSupported(type)) || '';

        if (!mimeType) {
          console.error('No supported mimeType found');
          setMessage('Error: Unsupported media type');
          return;
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        let localChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            localChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(localChunks, { type: mimeType });
          sendToServer(blob);
          localChunks = [];
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setMessage('Error accessing media devices.');
      }
    };

    startMediaStream();
  }, []);

  return (
    <div className="ai-container">
      <div className="video-container">
        <h1 className="title">AI Interaction</h1>
        <div className="video-section">
          <video ref={videoRef} className="video" autoPlay playsInline></video>
        </div>
        <div>
          {!isRecording ? (
            <button onClick={startRecording}>Start Recording</button>
          ) : (
            <button onClick={stopRecording}>Stop Recording</button>
          )}
        </div>
        <p className="status">{isRecording ? 'Recording...' : 'Not recording'}</p>
        <p className="status">{message}</p>
        {transcript && (
          <div className="transcript-section">
            <h3>Transcript:</h3>
            <p>{transcript}</p>
          </div>
        )}
        {audioEmotions && (
          <div className="audio-emotions-section">
            <h3>Audio Emotions:</h3>
            <ul>
              {audioEmotions.map((emotion, index) => (
                <li key={index}>
                  {emotion.label}: {emotion.score.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {videoEmotion && (
          <div className="video-emotion-section">
            <h3>Dominant Video Emotion:</h3>
            <p>{videoEmotion}</p>
          </div>
        )}
        {response && (
          <div className="response-section">
            <h3>AI Response:</h3>
            <p>{response}</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default Ai;
