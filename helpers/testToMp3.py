# pip install gtts

from gtts import gTTS
import os

def malayalam_text_to_speech(text, output_file="output.mp3"):
    """Convert Malayalam text to speech and save as MP3."""
    tts = gTTS(text=text, lang="ml")  # 'ml' is the language code for Malayalam
    tts.save(output_file)
    print(f"Audio saved as {output_file}")
    os.system(f"start {output_file}")  # Open the MP3 file (for Windows)

# Example usage
text = "മലയാളം ഒരു മനോഹരമായ ഭാഷയാണ്"  # Malayalam text
malayalam_text_to_speech(text)
