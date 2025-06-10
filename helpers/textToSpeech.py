import json
import os
from gtts import gTTS

# Ensure output directories exist
os.makedirs("audio/letter", exist_ok=True)
os.makedirs("audio/word", exist_ok=True)

def text_to_speech(text, output_path):
    """Convert text to speech and save as MP3."""
    tts = gTTS(text=text, lang="ml")  # Malayalam language code
    tts.save(output_path)
    print(f"Generated: {output_path}")

def process_json(file_path, audio_dir, key):
    """Process JSON file to generate audio for each letter/word."""
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    for item in data:
        audio_file = f"../public/{audio_dir}/{item['id']}.mp3"
        text_to_speech(item[key], audio_file)

# Process letters
process_json("../public/lettersData.json", "audio/letters", "character")

# Process words
process_json("../public/wordsData.json", "audio/words", "word")

print("All audio files generated successfully!")
