from flask import Flask, request, jsonify, send_file
import os
from flask_cors import CORS
from extract_audio_and_text import process_video_and_extract_text
from emotion_analysis import analyze_emotions_from_video
from concurrent.futures import ThreadPoolExecutor
import time
from gtts import gTTS
from pydub import AudioSegment
import ollama

app = Flask(__name__)
CORS(app)

# Create an uploads folder to store video/audio files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/upload', methods=['POST'])
def upload_file():
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
        with ThreadPoolExecutor(max_workers=3) as executor:
            start_time = time.time()

            # Submit tasks to executor
            extract_audio_future = executor.submit(process_video_and_extract_text, file_path)
            analyze_emotions_future = executor.submit(analyze_emotions_from_video, file_path)

            # Wait for the extraction and emotion analysis to complete
            audio_path, transcript, emotions = extract_audio_future.result()
            dominant_emotion, all_emotions = analyze_emotions_future.result()

            input_text = (
                f"Based on the video, the user seems to be feeling {dominant_emotion}. "
                f"They mentioned: '{transcript}'. "
                "Please provide a concise and supportive response that acknowledges their feelings and offers a brief suggestion or encouragement"
            )


            # Use Ollama API to generate a response
            response = ollama.chat(
                model='llama3.1:latest', messages=[
                {"role": "user", "content": input_text}
            ])

            generated_response = response['message']['content']

            # Convert the generated response to speech using gTTS
            tts = gTTS(generated_response)
            audio_response_path = os.path.join(UPLOAD_FOLDER, 'response.mp3')
            tts.save(audio_response_path)

            # Optional: Convert to WAV format (if needed)
            sound = AudioSegment.from_mp3(audio_response_path)
            wav_audio_response_path = os.path.join(UPLOAD_FOLDER, 'response.wav')
            sound.export(wav_audio_response_path, format="wav")

            # Measure time taken
            end_time = time.time()
            time_taken = end_time - start_time

            print(f"Time Taken: {time_taken:.2f} seconds")
            print(f"Audio Path: {audio_path}")
            print(f"Transcript: {transcript}")
            print(f"Dominant Emotion: {dominant_emotion}")
            print(f"All Emotions: {all_emotions}")
            print(f"Audio Emotions: {emotions}")
            print(f"Generated Response: {generated_response}")
            print(f"Response Audio Path: {wav_audio_response_path}")

            return send_file(wav_audio_response_path, mimetype='audio/wav')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
