# Malayalam script generator

# Vowels (Swaraksharam)
vowels = [
    "അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "ഋ", "എ", "ഏ", "ഐ", "ഒ", "ഓ", "ഔ"
]

# Consonants (Vyanjanaksharam)
consonants = [
    "ക", "ഖ", "ഗ", "ഘ", "ങ",
    "ച", "ഛ", "ജ", "ഝ", "ഞ",
    "ട", "ഠ", "ഡ", "ഢ", "ണ",
    "ത", "ഥ", "ദ", "ധ", "ന",
    "പ", "ഫ", "ബ", "ഭ", "മ",
    "യ", "ര", "ല", "വ", "ശ",
    "ഷ", "സ", "ഹ", "ള", "ഴ", "റ"
]

# Compound Characters (Example: consonant + vowel combinations)
compound_characters = [c + v for c in consonants for v in vowels]

# Display Malayalam letters
print("Malayalam Vowels:", vowels)
print("Malayalam Consonants:", consonants)
print("Sample Compound Characters:", compound_characters[:30])  # Display first 30 samples
