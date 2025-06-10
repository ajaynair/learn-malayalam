import json
from googletrans import Translator

# Initialize translator
translator = Translator()

# Load English JSON data
with open("english.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Translate values to Hindi
translated_data = {key: translator.translate(value, src="en", dest="hi").text for key, value in data.items()}

# Save translated data to new JSON file
with open("hindi.json", "w", encoding="utf-8") as f:
    json.dump(translated_data, f, ensure_ascii=False, indent=4)

print("Translation completed! Saved as hindi.json.")

