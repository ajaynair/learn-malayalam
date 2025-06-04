// Removed: import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface MalayalamLetter { // Interface updated: no example fields
  id: string;
  character: string;
  displayCharacterOverride?: string;
  category: 'vowel' | 'consonant' | 'chillu' | 'kootaksharam' | 'matra';
  transliteration: string;
  audioOverride?: string;

  lastReviewedTimestamp: number;
  nextReviewTimestamp: number;
  intervalDays: number;
  easeFactor: number;
  correctStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
  reviewed: boolean;
}

// Initial data type reflects the updated MalayalamLetter interface
const initialLettersData: Omit<MalayalamLetter, 'lastReviewedTimestamp' | 'nextReviewTimestamp' | 'intervalDays' | 'easeFactor' | 'correctStreak' | 'totalCorrect' | 'totalIncorrect' | 'reviewed'>[] = [
  // Vowels (സ്വരാക്ഷരങ്ങൾ)
  { id: 'v01', character: 'അ', category: 'vowel', transliteration: 'a' },
  { id: 'v02', character: 'ആ', category: 'vowel', transliteration: 'aa' },
  { id: 'v03', character: 'ഇ', category: 'vowel', transliteration: 'i' },
  { id: 'v04', character: 'ഈ', category: 'vowel', transliteration: 'ee' },
  { id: 'v05', character: 'ഉ', category: 'vowel', transliteration: 'u' },
  { id: 'v06', character: 'ഊ', category: 'vowel', transliteration: 'oo' },
  { id: 'v07', character: 'ഋ', category: 'vowel', transliteration: 'ru' , audioOverride: 'ഋ'},
  { id: 'v08', character: 'എ', category: 'vowel', transliteration: 'e' },
  { id: 'v09', character: 'ഏ', category: 'vowel', transliteration: 'ee' },
  { id: 'v10', character: 'ഐ', category: 'vowel', transliteration: 'ai' },
  { id: 'v11', character: 'ഒ', category: 'vowel', transliteration: 'o' },
  { id: 'v12', character: 'ഓ', category: 'vowel', transliteration: 'oo' },
  { id: 'v13', character: 'ഔ', category: 'vowel', transliteration: 'au' },
  { id: 'v14', character: 'അം', category: 'vowel', transliteration: 'am' }, // Anusvara
  { id: 'v15', character: 'അഃ', category: 'vowel', transliteration: 'ah' }, // Visarga

  // Consonants (വ്യഞ്ജനാക്ഷരങ്ങൾ)
  { id: 'c01', character: 'ക', category: 'consonant', transliteration: 'ka' },
  { id: 'c02', character: 'ഖ', category: 'consonant', transliteration: 'kha' },
  { id: 'c03', character: 'ഗ', category: 'consonant', transliteration: 'ga' },
  { id: 'c04', character: 'ഘ', category: 'consonant', transliteration: 'gha' },
  { id: 'c05', character: 'ങ', category: 'consonant', transliteration: 'nga' },
  { id: 'c06', character: 'ച', category: 'consonant', transliteration: 'cha' },
  { id: 'c07', character: 'ഛ', category: 'consonant', transliteration: 'chha' },
  { id: 'c08', character: 'ജ', category: 'consonant', transliteration: 'ja' },
  { id: 'c09', character: 'ഝ', category: 'consonant', transliteration: 'jha' },
  { id: 'c10', character: 'ഞ', category: 'consonant', transliteration: 'nja' },
  { id: 'c11', character: 'ട', category: 'consonant', transliteration: 'Ta' },
  { id: 'c12', character: 'ഠ', category: 'consonant', transliteration: 'Tha' },
  { id: 'c13', character: 'ഡ', category: 'consonant', transliteration: 'Da' },
  { id: 'c14', character: 'ഢ', category: 'consonant', transliteration: 'Dha' },
  { id: 'c15', character: 'ണ', category: 'consonant', transliteration: 'Na' },
  { id: 'c16', character: 'ത', category: 'consonant', transliteration: 'tha' },
  { id: 'c17', character: 'ഥ', category: 'consonant', transliteration: 'thha' },
  { id: 'c18', character: 'ദ', category: 'consonant', transliteration: 'da' },
  { id: 'c19', character: 'ധ', category: 'consonant', transliteration: 'dha' },
  { id: 'c20', character: 'ന', category: 'consonant', transliteration: 'na' },
  { id: 'c21', character: 'പ', category: 'consonant', transliteration: 'pa' },
  { id: 'c22', character: 'ഫ', category: 'consonant', transliteration: 'pha' },
  { id: 'c23', character: 'ബ', category: 'consonant', transliteration: 'ba' },
  { id: 'c24', character: 'ഭ', category: 'consonant', transliteration: 'bha' },
  { id: 'c25', character: 'മ', category: 'consonant', transliteration: 'ma' },
  { id: 'c26', character: 'യ', category: 'consonant', transliteration: 'ya' },
  { id: 'c27', character: 'ര', category: 'consonant', transliteration: 'ra' },
  { id: 'c28', character: 'ല', category: 'consonant', transliteration: 'la' },
  { id: 'c29', character: 'വ', category: 'consonant', transliteration: 'va' },
  { id: 'c30', character: 'ശ', category: 'consonant', transliteration: 'sha' },
  { id: 'c31', character: 'ഷ', category: 'consonant', transliteration: 'zha' },
  { id: 'c32', character: 'സ', category: 'consonant', transliteration: 'sa' },
  { id: 'c33', character: 'ഹ', category: 'consonant', transliteration: 'ha' },
  { id: 'c34', character: 'ള', category: 'consonant', transliteration: 'la' },
  { id: 'c35', character: 'ഴ', category: 'consonant', transliteration: 'zha' },
  { id: 'c36', character: 'റ', category: 'consonant', transliteration: 'ra' },

  // Chillu Aksharam (ചില്ലക്ഷരങ്ങൾ)
  { id: 'ch1', character: 'ൽ', category: 'chillu', transliteration: 'l' },
  { id: 'ch2', character: 'ൻ', category: 'chillu', transliteration: 'n' },
  { id: 'ch3', character: 'ർ', category: 'chillu', transliteration: 'r' },
  { id: 'ch4', character: 'ൾ', category: 'chillu', transliteration: 'L' },
  { id: 'ch5', character: 'ൺ', category: 'chillu', transliteration: 'n' },

  // Matras (Vowel Diacritics - സ്വരചിഹ്നങ്ങൾ)
  { id: 'm01', character: 'ാ', category: 'matra', transliteration: 'aa' },
  { id: 'm02', character: 'ി', category: 'matra', transliteration: 'e' },
  { id: 'm03', character: 'ീ', category: 'matra', transliteration: 'ee' },
  { id: 'm04', character: 'ു', category: 'matra', transliteration: 'u' },
  { id: 'm05', character: 'ൂ', category: 'matra', transliteration: 'oo' },
  { id: 'm06', character: 'ൃ', category: 'matra', transliteration: 'ru' },
  { id: 'm07', character: 'െ', category: 'matra', transliteration: 'e' },
  { id: 'm08', character: 'േ', category: 'matra', transliteration: 'ee' },
  { id: 'm09', character: 'ൈ', category: 'matra', transliteration: 'ai' },
  { id: 'm10', character: 'ൊ', category: 'matra', transliteration: 'o' },
  { id: 'm11', character: 'ോ', category: 'matra', transliteration: 'oo' },
  { id: 'm12', character: 'ൌ', category: 'matra', transliteration: 'au' },
  { id: 'm13', character: 'ം', category: 'matra', transliteration: 'am' },
  { id: 'm14', character: 'ഃ', category: 'matra', transliteration: 'ah' },

  // Kootaksharam (കൂട്ടക്ഷരങ്ങൾ - Common Ligatures)
  { id: 'k01', character: 'ക്ക', category: 'kootaksharam', transliteration: 'kka' },
  { id: 'k02', character: 'ങ്ക', category: 'kootaksharam', transliteration: 'nka' },
  { id: 'k03', character: 'ച്ച', category: 'kootaksharam', transliteration: 'chcha' },
  { id: 'k04', character: 'ഞ്ച', category: 'kootaksharam', transliteration: 'ncha' },
  { id: 'k05', character: 'ട്ട', category: 'kootaksharam', transliteration: 'tta' },
  { id: 'k06', character: 'ണ്ട', category: 'kootaksharam', transliteration: 'Nta' },
  { id: 'k07', character: 'ണ്ണ', category: 'kootaksharam', transliteration: 'NNa' },
  { id: 'k08', character: 'ത്ത', category: 'kootaksharam', transliteration: 'ththa' },
  { id: 'k09', character: 'ന്ത', category: 'kootaksharam', transliteration: 'ntha' },
  { id: 'k10', character: 'പ്പ', category: 'kootaksharam', transliteration: 'ppa' },
  { id: 'k11', character: 'മ്പ', category: 'kootaksharam', transliteration: 'mba' },
  { id: 'k12', character: 'മ്മ', category: 'kootaksharam', transliteration: 'mma' },
  { id: 'k13', character: 'യ്യ', category: 'kootaksharam', transliteration: 'yya' },
  { id: 'k14', character: 'ല്ല', category: 'kootaksharam', transliteration: 'lla' },
  { id: 'k15', character: 'വ്വ', category: 'kootaksharam', transliteration: 'vva' },
  { id: 'k16', character: 'ശ്ശ', category: 'kootaksharam', transliteration: 'shsha' },
  { id: 'k17', character: 'ക്ഷ', category: 'kootaksharam', transliteration: 'ksha' },
  { id: 'k18', character: 'ജ്ഞ', category: 'kootaksharam', transliteration: 'jnya' },
  { id: 'k19', character: 'ക്ര', category: 'kootaksharam', transliteration: 'kra' },
  { id: 'k20', character: 'പ്ര', category: 'kootaksharam', transliteration: 'pra' },
  { id: 'k21', character: 'ദ്ര', category: 'kootaksharam', transliteration: 'dra' },
  { id: 'k22', character: 'ശ്ച', category: 'kootaksharam', transliteration: 'shcha' },
  { id: 'k23', character: 'സ്ഥ', category: 'kootaksharam', transliteration: 'stha' },
];

const App = {
  letters: [] as MalayalamLetter[],
  currentLetter: null as MalayalamLetter | null,
  options: [] as string[],
  score: 0,
  sessionCorrectStreak: 0,
  reviewedTodayCount: 0,
  localStorageKey: 'malayalamAppProgress_v3_speech_fix', // Updated key for new data structure

  // Speech Synthesis related properties
  voices: [] as SpeechSynthesisVoice[],
  speechSynthesisReady: false,
  speechSynthesisSupported: false,
  speechSynthesisUtterance: null as SpeechSynthesisUtterance | null,
  voiceLoadTimeoutId: null as number | null,


  DOM: {
    letterDisplay: document.getElementById('letter-display')!,
    optionsContainer: document.getElementById('options-container')!,
    feedbackArea: document.getElementById('feedback-area')!,
    nextQuestionBtn: document.getElementById('next-question-btn') as HTMLButtonElement,
    scoreDisplay: document.getElementById('score')!,
    correctStreakDisplay: document.getElementById('correct-streak-display')!,
    reviewedCountDisplay: document.getElementById('reviewed-count')!,
    totalLettersCountDisplay: document.getElementById('total-letters-count')!,
  },

  init() {
    this.DOM.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
    
    this.initializeSpeechSynthesis(); // Initialize speech synthesis
    this.loadLetters();
    this.updateProgressDisplay();
    this.nextQuestion();
  },
  
  initializeSpeechSynthesis() {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        this.speechSynthesisSupported = true;
        this.speechSynthesisUtterance = new SpeechSynthesisUtterance(); // Create one instance

        const loadVoices = () => {
            if (this.voiceLoadTimeoutId !== null) {
                clearTimeout(this.voiceLoadTimeoutId);
                this.voiceLoadTimeoutId = null;
            }
            this.voices = window.speechSynthesis.getVoices();
            if (this.voices.length > 0) {
                this.speechSynthesisReady = true;
                console.log('Speech synthesis voices loaded successfully:', this.voices.map(v => ({name: v.name, lang: v.lang, default: v.default})));
            } else {
                console.warn('No speech synthesis voices available yet (onvoiceschanged or initial load).');
                // Keep speechSynthesisReady as false
            }
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Attempt to load voices immediately

        this.voiceLoadTimeoutId = window.setTimeout(() => {
            this.voiceLoadTimeoutId = null; // Clear the ID as timeout has fired
            if (!this.speechSynthesisReady && this.voices.length === 0) {
                console.warn('Retrying to load voices after timeout (2s).');
                loadVoices(); // Try one last time
                if (!this.speechSynthesisReady && this.voices.length === 0) { // Check after last attempt
                    console.error("Speech synthesis voices still not available after timeout.");
                    this.updateFeedback('Speech voices could not be loaded.', 'error');
                } else if (this.speechSynthesisReady) {
                     console.log('Speech synthesis voices loaded successfully after timeout.');
                }
            }
        }, 2000); // Increased timeout

    } else {
        console.warn('Speech synthesis not supported by this browser.');
        this.updateFeedback('Speech synthesis not supported.', 'error');
        this.speechSynthesisSupported = false;
    }
  },

  loadLetters() {
    const savedData = localStorage.getItem(this.localStorageKey);
    if (savedData) {
        const parsedSavedData: MalayalamLetter[] = JSON.parse(savedData);
        // Filter out any letters from savedData that are no longer in initialLettersData (e.g., if data source changed)
        const validSavedLetters = parsedSavedData.filter(sl => initialLettersData.some(il => il.id === sl.id));
        
        this.letters = initialLettersData.map(initialLetter => {
            const savedVersion = validSavedLetters.find(sl => sl.id === initialLetter.id);
            if (savedVersion) {
                return { // Merge, ensuring initial core data (char, translit) is fresh, SRS data is from save
                    ...this.getDefaultSRDFields(), // Base SRD
                    ...initialLetter, // Fresh character, translit, category, overrides
                    ...savedVersion, // Overwrite SRD fields with saved ones
                     // Explicitly keep fresh character data to avoid issues if it changed in initialLettersData
                    character: initialLetter.character, 
                    displayCharacterOverride: initialLetter.displayCharacterOverride,
                    category: initialLetter.category,
                    transliteration: initialLetter.transliteration,
                    audioOverride: initialLetter.audioOverride,
                };
            }
            return { ...initialLetter, ...this.getDefaultSRDFields() };
        });
    } else {
        this.letters = initialLettersData.map(l => ({
            ...l,
            ...this.getDefaultSRDFields()
        }));
    }
    this.DOM.totalLettersCountDisplay.textContent = this.letters.length.toString();
  },

  getDefaultSRDFields(): Pick<MalayalamLetter, 'lastReviewedTimestamp' | 'nextReviewTimestamp' | 'intervalDays' | 'easeFactor' | 'correctStreak' | 'totalCorrect' | 'totalIncorrect' | 'reviewed'> {
    return {
        lastReviewedTimestamp: 0,
        nextReviewTimestamp: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        correctStreak: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        reviewed: false,
    };
  },

  saveLetters() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.letters));
  },

  selectLetterForQuiz(): MalayalamLetter | null {
    const now = Date.now();
    // Prioritize due letters that have been reviewed before
    const dueReviewedLetters = this.letters.filter(l => l.reviewed && l.nextReviewTimestamp <= now);
    if (dueReviewedLetters.length > 0) {
        dueReviewedLetters.sort((a, b) => a.nextReviewTimestamp - b.nextReviewTimestamp); // Oldest due first
        return dueReviewedLetters[0];
    }

    // Then, new letters that haven't been reviewed yet
    const newLetters = this.letters.filter(l => !l.reviewed);
    if (newLetters.length > 0) {
        // Simple random selection for new letters
        return newLetters[Math.floor(Math.random() * newLetters.length)];
    }

    // If all letters reviewed and none are "due" according to SRS, pick the one reviewed longest ago
    // This ensures the app doesn't get stuck if all intervals are long.
    if (this.letters.length > 0) {
        const sortedByLastReviewed = [...this.letters].filter(l => l.reviewed).sort((a,b) => a.lastReviewedTimestamp - b.lastReviewedTimestamp);
        if (sortedByLastReviewed.length > 0) return sortedByLastReviewed[0];
    }
    
    return null; // Should only happen if this.letters is empty
  },

  generateOptions(correctLetter: MalayalamLetter): string[] {
    const options = new Set<string>();
    options.add(correctLetter.transliteration);

    const distractors = this.letters.filter(l => l.id !== correctLetter.id && l.transliteration !== correctLetter.transliteration);
    
    const numOptions = Math.min(4, this.letters.length > 0 ? this.letters.length : 1);

    while (options.size < numOptions && distractors.length > 0) {
        const randomIndex = Math.floor(Math.random() * distractors.length);
        options.add(distractors[randomIndex].transliteration);
        distractors.splice(randomIndex, 1); 
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  handleOptionClick(selectedTransliteration: string) {
    if (!this.currentLetter) return;

    this.DOM.optionsContainer.querySelectorAll('button').forEach(btn => (btn as HTMLButtonElement).disabled = true);
    this.DOM.nextQuestionBtn.style.display = 'block';

    const isCorrect = selectedTransliteration === this.currentLetter.transliteration;

    if (isCorrect) {
        this.score++;
        this.sessionCorrectStreak++;
        this.currentLetter.correctStreak++;
        this.currentLetter.totalCorrect++;
        this.updateFeedback(`${this.currentLetter.displayCharacterOverride || this.currentLetter.character} is correct! (${this.currentLetter.transliteration})`, 'correct');
        
        if (this.currentLetter.correctStreak === 1) this.currentLetter.intervalDays = 1;
        else if (this.currentLetter.correctStreak === 2) this.currentLetter.intervalDays = 6;
        else this.currentLetter.intervalDays = Math.ceil(this.currentLetter.intervalDays * this.currentLetter.easeFactor);
        this.currentLetter.intervalDays = Math.min(this.currentLetter.intervalDays, 365); 
        this.currentLetter.easeFactor += 0.1; 

    } else {
        this.sessionCorrectStreak = 0;
        this.currentLetter.correctStreak = 0;
        this.currentLetter.totalIncorrect++;
        this.updateFeedback(`Incorrect. This is ${this.currentLetter.displayCharacterOverride || this.currentLetter.character} (${this.currentLetter.transliteration}).`, 'incorrect');
        this.speakLetter(this.currentLetter, true); 
        this.currentLetter.intervalDays = 1; 
        this.currentLetter.easeFactor = Math.max(1.3, this.currentLetter.easeFactor - 0.2); 
    }

    this.currentLetter.lastReviewedTimestamp = Date.now();
    this.currentLetter.nextReviewTimestamp = Date.now() + (this.currentLetter.intervalDays * 24 * 60 * 60 * 1000);
    if(!this.currentLetter.reviewed) { 
        this.reviewedTodayCount++; 
    }
    this.currentLetter.reviewed = true;
    
    this.saveLetters();
    this.updateProgressDisplay();
    
    this.DOM.optionsContainer.querySelectorAll('button').forEach(button => {
        const btn = button as HTMLButtonElement;
        if (btn.textContent === selectedTransliteration) {
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (btn.textContent === this.currentLetter?.transliteration && !isCorrect) {
             btn.classList.add('correct'); 
        }
    });
  },

  nextQuestion() {
    this.currentLetter = this.selectLetterForQuiz();
    this.DOM.nextQuestionBtn.style.display = 'none';

    if (this.currentLetter) {
        this.options = this.generateOptions(this.currentLetter);
        this.renderQuiz();
        this.updateFeedback('Choose the correct sound/transliteration.', 'info');
    } else {
        this.DOM.letterDisplay.textContent = '🎉';
        this.updateFeedback('All letters learned for now! Come back later for review or reset progress.', 'success');
        this.DOM.optionsContainer.innerHTML = ''; 
    }
  },
  
  renderQuiz() {
    if (!this.currentLetter) return;
    this.DOM.letterDisplay.textContent = this.currentLetter.displayCharacterOverride || this.currentLetter.character;
    this.DOM.letterDisplay.setAttribute('aria-label', `Malayalam letter: ${this.currentLetter.displayCharacterOverride || this.currentLetter.character}`);

    this.DOM.optionsContainer.innerHTML = '';
    this.options.forEach(opt => {
        const button = document.createElement('button');
        button.textContent = opt;
        button.setAttribute('aria-label', `Option: ${opt}`);
        button.onclick = () => this.handleOptionClick(opt);
        this.DOM.optionsContainer.appendChild(button);
    });
  },

  speak(text: string, lang: string = 'ml-IN', rate: number = 0.9, pitch: number = 1.1) {
    if (!this.speechSynthesisSupported || !this.speechSynthesisUtterance) {
        console.warn('Speech synthesis not initialized or not supported.');
        this.updateFeedback('Speech synthesis setup issue.', 'error');
        return;
    }

    // Strictly rely on speechSynthesisReady being true.
    if (!this.speechSynthesisReady) {
        console.error('Cannot speak: Speech synthesis voices are not ready or available.');
        this.updateFeedback('Speech voices not ready. Try refreshing.', 'error');
        return;
    }
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = this.speechSynthesisUtterance;
    utterance.text = text;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.voice = null; 

    let selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN');
    if (!selectedVoice) {
        selectedVoice = this.voices.find(voice => voice.lang.startsWith('ml-'));
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        console.warn(`Malayalam voice ('ml-IN' or 'ml-') not found. Using browser default for lang '${lang}'.`);
    }
    
    utterance.onstart = () => {};
    utterance.onend = () => {};
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error, event);
        let errorMsg = `Speech error: ${event.error}.`;
        if(event.error === 'language-unavailable' || event.error === 'voice-unavailable'){
            errorMsg += ` Please check if Malayalam voice support is installed in your browser/OS.`;
        } else if (event.error === 'synthesis-failed' || event.error === 'audio-busy') {
             errorMsg += ` Try again.`;
        }
        this.updateFeedback(errorMsg, 'error');
    };

    window.speechSynthesis.speak(utterance);
  },

  speakLetter(letter: MalayalamLetter, emphatic: boolean = false) {
    const textToSpeak = letter.audioOverride || letter.character;
    this.speak(textToSpeak, 'ml-IN', emphatic ? 0.85 : 0.95, emphatic ? 1.0 : 1.1);
  },
  
  updateFeedback(message: string, type: 'info' | 'error' | 'success' | 'correct' | 'incorrect') {
    this.DOM.feedbackArea.textContent = message;
    this.DOM.feedbackArea.className = `feedback ${type}`;
  },

  updateProgressDisplay() {
    this.DOM.scoreDisplay.textContent = this.score.toString();
    this.DOM.correctStreakDisplay.textContent = this.sessionCorrectStreak.toString();
    // Updated to show total number of unique letters marked as 'reviewed'
    this.DOM.reviewedCountDisplay.textContent = this.letters.filter(l => l.reviewed).length.toString(); 
  },
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof document !== 'undefined' && document.fonts) {
      Promise.all([
        document.fonts.load('1em "Noto Sans Malayalam"'),
        document.fonts.load('1em "Noto Sans"') 
      ]).then(() => {
          App.init();
      }).catch(err => {
          console.warn('Required fonts could not be loaded or confirmed, initializing app anyway.', err);
          App.init(); 
      });
    } else {
        App.init();
    }
});
