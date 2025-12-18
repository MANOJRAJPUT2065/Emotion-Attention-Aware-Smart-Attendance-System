from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import vertexai
from vertexai.generative_models import GenerativeModel
import logging
import re
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Vertex AI and Gemini model
logging.info("Initializing Vertex AI...")
vertexai.init(project="sri-devi-hack", location="asia-south1")
model = GenerativeModel("gemini-1.5-pro-002")

# Load Wav2Vec model and processor
logging.info("Loading Wav2Vec model...")
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
emotion_model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")  # Using the same model for transcription

# Create a chat session at the global level so the context is preserved
chat = model.start_chat()

# Define a therapeutic prompt template
therapist_prompt_template = (
    "Imagine you are a mental health therapist. The user has come to you seeking help. "
    "Respond with short, concise answers that are direct and to the point. "
    "When the user asks for what to do or requests suggestions, then only give long answers. "
    "Be encouraging, supportive, and non-judgmental."
)

# Load the initial therapist prompt (optional)
load = chat.send_message(therapist_prompt_template)
logging.info("Initial therapist prompt loaded: %s", load.text)

@app.errorhandler(Exception)
def handle_exception(e):
    logging.error("An unhandled exception occurred: %s", str(e))
    return jsonify({'error': 'Internal Server Error'}), 500

def transcribe_audio(audio_data):
    # Preprocess audio data
    input_values = processor(audio_data, return_tensors="pt", padding="longest").input_values
    with torch.no_grad():
        logits = emotion_model(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.batch_decode(predicted_ids)[0]
    return transcription

def analyze_emotion(transcription):
    # Basic emotion detection logic (this can be enhanced with a proper model)
    emotion_keywords = {
        "happy": "joy",
        "sad": "sadness",
        "angry": "anger",
        "excited": "joy",
        "anxious": "anxiety",
        "frustrated": "frustration"
    }
    
    for keyword, emotion in emotion_keywords.items():
        if keyword in transcription.lower():
            return emotion
    
    return "neutral"  # Default if no emotion is detected

@app.route('/chat', methods=['POST'])
def chat_response():
    logging.info("Received a chat request.")
    
    data = request.json
    user_message = data.get('message')
    audio = data.get('audio')  # Receive audio data if available

    if not user_message and not audio:
        logging.warning("No message or audio provided in the request.")
        return jsonify({'error': 'No message or audio provided'}), 400
    
    # If audio is provided, process it to get the transcription and emotion
    if audio:
        try:
            # Assuming audio is sent as binary data in the request
            audio_data = audio  # You may need to decode or convert this based on your frontend implementation
            transcription = transcribe_audio(audio_data)
            logging.info("Transcription from audio: %s", transcription)

            # Analyze emotion from the transcription
            emotion = analyze_emotion(transcription)
            logging.info("Detected emotion: %s", emotion)
        except Exception as e:
            logging.error("Error processing audio: %s", str(e))
            return jsonify({'error': 'Error processing audio'}), 500
    else:
        emotion = "neutral"  # Default emotion if no audio provided

    try:
        # Construct the prompt using the user's message and emotion
        full_prompt = f"User's message: {user_message}\nTranscription Emotion: {emotion}. Respond accordingly."
        logging.debug("Constructed full prompt: %s", full_prompt)

        # Use streaming to send the prompt to Vertex AI and get the response
        stream = chat.send_message(full_prompt, stream=True)

        # Collect and concatenate all chunks from the stream
        response_text = ''.join([message.text for message in stream])
        
        response_text = re.sub(r'\*', '', response_text)

        logging.info("Full AI response: %s", response_text)
        
        # Return the full response as JSON
        return jsonify({'response': response_text}), 200

    except Exception as e:
        logging.error("Error occurred while processing request: %s", str(e))
        return jsonify({'error': str(e)}), 500

# New route to handle quiz score submission
@app.route('/quizScore', methods=['POST'])
def quiz_score():
    logging.info("Received quiz score submission.")

    data = request.json
    questions = data.get('questions')
    answers = data.get('answers')
    score = data.get('score')

    if not questions or not answers or score is None:
        logging.warning("Incomplete data provided.")
        return jsonify({'error': 'Incomplete data provided'}), 400

    # Construct the base prompt
    full_prompt = f"The user answered the following questions:\n"
    
    for question, answer in zip(questions, answers):
        full_prompt += f"Question: {question}\nAnswer: {answer}\n"

    # Add a conclusion based on score
    res = ""
    if score >= 3:
        res += (
            "Based on these answers, it seems like the user is experiencing significant emotional distress. "
            "It is advisable for the user to consult a mental health professional for appropriate support. "
            "Additionally, trying Zen AI for relaxation techniques and coping strategies can be beneficial. "
            "This platform can provide tools to help manage stress and improve overall well-being. "
            "Taking this step may greatly enhance the user's mental health."
        )
    else:
        res += (
            "Based on these answers, the user is showing some signs of emotional struggle, but they may not be severe. "
            "Encouragement and self-care strategies are recommended. Trying Zen AI could also offer useful relaxation techniques "
            "to help improve their mood and maintain emotional balance. It's a proactive step toward better mental health."
        )

    logging.debug("Constructed full prompt: %s", full_prompt)

    try:
        # Return the full response as JSON
        return jsonify({'response': res}), 200

    except Exception as e:
        logging.error("Error occurred while processing request: %s", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logging.info("Starting Flask server...")
    app.run(debug=True, port=3001)
