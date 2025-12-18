from transformers import pipeline

# Load the audio classification pipeline
pipe = pipeline("audio-classification", model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition")

# Define a function to classify emotions from an audio file
def classify_emotion(audio_file_path):
    # Use the pipeline to classify emotion from audio
    predictions = pipe(audio_file_path)

    # Print the results
    for pred in predictions:
        label = pred['label']
        score = pred['score']
        print(f"Emotion: {label}, Confidence: {score:.4f}")

# Example usage with an audio file
classify_emotion("recording.wav")
