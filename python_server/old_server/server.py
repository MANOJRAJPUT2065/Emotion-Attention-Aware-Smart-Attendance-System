import os
from pydub import AudioSegment
import speech_recognition as sr
from concurrent.futures import ThreadPoolExecutor
import time  # To log time
from transformers import pipeline  # Hugging Face pipeline for emotion detection
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from emotion_analysis import analyze_emotions_from_video

# Flask app setup
app = Flask(__name__)
CORS(app)

# Create an uploads folder to store video/audio files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Load the emotion recognition model once globally when the server starts
emotion_recognition = pipeline(model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition")

# Function to extract audio from a .webm video file and convert it to .wav
def extract_audio_from_webm(video_file_path, output_audio_path):
    audio = AudioSegment.from_file(video_file_path, format="webm")
    audio.export(output_audio_path, format="wav")

# Function to transcribe audio to text using speech recognition
def transcribe_audio_to_text(audio_file_path):
    recognizer = sr.Recognizer()

    with sr.AudioFile(audio_file_path) as source:
        audio = recognizer.record(source)

    try:
        text = recognizer.recognize_google(audio)
        return text
    except sr.UnknownValueError:
        return "Audio not clear enough to transcribe."
    except sr.RequestError:
        return "API request failed."

# Function to detect emotions using the preloaded Hugging Face model
def detect_emotions(audio_file_path):
    # Read the audio file for emotion detection
    with open(audio_file_path, 'rb') as f:
        audio_bytes = f.read()

    # Run the emotion recognition
    emotions = emotion_recognition(audio_bytes)
    return emotions

# Main function to handle both extraction and transcription
def process_video_and_extract_text(video_file_path):
    output_audio_path = os.path.splitext(video_file_path)[0] + ".wav"

    # Record the start time
    start_time = time.time()

    # Run extraction, transcription, and emotion detection in parallel
    with ThreadPoolExecutor(max_workers=3) as executor:
        # Schedule the audio extraction
        extract_future = executor.submit(extract_audio_from_webm, video_file_path, output_audio_path)
        extract_future.result()  # Wait for extraction to complete before further steps

        # Once the audio is extracted, transcribe it and detect emotions in parallel
        transcript_future = executor.submit(transcribe_audio_to_text, output_audio_path)
        emotion_future = executor.submit(detect_emotions, output_audio_path)

        # Get the transcription and emotion results
        transcript = transcript_future.result()
        emotions = emotion_future.result()

    # Record the end time
    end_time = time.time()

    # Log the time taken
    time_taken = end_time - start_time
    print(f"Time taken for Audio execution: {time_taken:.2f} seconds")

    # Print results
    print(f"Audio Emotions: {emotions}")

    return output_audio_path, transcript, emotions


@app.route('/upload', methods=['POST'])
def upload_file():
    print("Request Hit .. !")
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if file:
        # Save the file to the uploads folder
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # Create a ThreadPoolExecutor to run tasks in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            start_time = time.time()

            # Submit tasks to executor
            extract_audio_future = executor.submit(process_video_and_extract_text, file_path)
            analyze_emotions_future = executor.submit(analyze_emotions_from_video, file_path)

            # Wait for the extraction and emotion analysis to complete
            audio_path, transcript, emotions = extract_audio_future.result()
            dominant_emotion, all_emotions = analyze_emotions_future.result()

            # Measure time taken
            end_time = time.time()
            time_taken = end_time - start_time

            print(f"Time Taken: {time_taken:.2f} seconds")
            print(f"Transcript: {transcript}")
            print(f"Dominant Emotion: {dominant_emotion}")
            print(f"Audio Emotions: {emotions}")

            # Prepare the response
            response_data = {
                "audio_emotions": emotions,
                "dominant_video_emotion": dominant_emotion,
                "transcript": transcript,
            }

            return jsonify(response_data), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
