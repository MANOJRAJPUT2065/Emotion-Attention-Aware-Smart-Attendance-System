import cv2
from deepface import DeepFace

# Function to extract frames from video
def extract_frames_from_video(video_file_path, step=30):
    vidcap = cv2.VideoCapture(video_file_path)
    frames = []
    frame_count = 0
    success, image = vidcap.read()
    
    while success:
        # Append the frame if it's the nth frame (determined by step)
        if frame_count % step == 0:
            frames.append(image)
        
        success, image = vidcap.read()
        frame_count += 1

    vidcap.release()
    return frames

# Function to analyze emotions from a frame
def analyze_emotion_in_frame(frame):
    try:
        # Analyze the frame, DeepFace might return a list if multiple faces are detected
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        
        emotions = []
        if isinstance(analysis, list):
            # Multiple faces detected, extract emotions from each face
            for face in analysis:
                emotions.append(face['dominant_emotion'])
        else:
            # Single face detected, extract the emotion
            emotions.append(analysis['dominant_emotion'])
        
        # Aggregate emotions (you could also return the full list)
        dominant_emotion = max(set(emotions), key=emotions.count)  # Most common emotion
        return dominant_emotion
    except Exception as e:
        print(f"Error analyzing frame: {str(e)}")
        return None

# Function to process a subset of frames and return dominant emotions
def analyze_emotions_from_video(video_file_path, step=20):
    # Extract only every nth frame (defined by step)
    frames = extract_frames_from_video(video_file_path, step=step)
    emotion_results = []
    
    for frame in frames:
        emotion = analyze_emotion_in_frame(frame)
        if emotion:
            emotion_results.append(emotion)
    
    # Aggregate emotions (e.g., majority voting)
    if emotion_results:
        dominant_emotion = max(set(emotion_results), key=emotion_results.count)
        return dominant_emotion, emotion_results
    else:
        return None, []
