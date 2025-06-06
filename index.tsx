
import { MalayalamLetter, initialLettersData } from './lettersData';
import { MalayalamWord, initialWordsData } from './wordsData'; // Import new word data

type QuizItem = MalayalamLetter | MalayalamWord;
type QuizMode = 'letters' | 'words';

interface SessionModeStats {
  score: number;
  streak: number;
}

const App = {
  quizMode: 'letters' as QuizMode,
  quizItems: [] as QuizItem[],
  currentItem: null as QuizItem | null,
  options: [] as string[],
  sessionStats: {
    letters: { score: 0, streak: 0 } as SessionModeStats,
    words: { score: 0, streak: 0 } as SessionModeStats,
  },
  localStorageKeyLetters: 'malayalamAppProgress_letters_v1',
  localStorageKeyWords: 'malayalamAppProgress_words_v1',
  localStorageKeyMode: 'malayalamAppQuizMode_v1',


  voices: [] as SpeechSynthesisVoice[],
  speechSynthesisReady: false,
  speechSynthesisSupported: false,
  speechSynthesisUtterance: null as SpeechSynthesisUtterance | null,
  voiceLoadTimeoutId: null as number | null,

  DOM: {
    itemDisplay: document.getElementById('item-display')!,
    optionsContainer: document.getElementById('options-container')!,
    feedbackArea: document.getElementById('feedback-area')!,
    nextQuestionBtn: document.getElementById('next-question-btn') as HTMLButtonElement,
    scoreDisplay: document.getElementById('score')!,
    correctStreakDisplay: document.getElementById('correct-streak-display')!,
    reviewedCountDisplay: document.getElementById('reviewed-count')!,
    totalItemsCountDisplay: document.getElementById('total-items-count')!,
    reviewedCountLabel: document.getElementById('reviewed-count-label')!,
    totalItemsLabel: document.getElementById('total-items-label')!,
    lettersModeBtn: document.getElementById('letters-mode-btn') as HTMLButtonElement,
    wordsModeBtn: document.getElementById('words-mode-btn') as HTMLButtonElement,
    headerCoffeeBtn: document.getElementById('header-coffee-btn') as HTMLButtonElement,
  },

  init() {
    this.DOM.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
    this.DOM.lettersModeBtn.addEventListener('click', () => this.switchQuizMode('letters'));
    this.DOM.wordsModeBtn.addEventListener('click', () => this.switchQuizMode('words'));
    if(this.DOM.headerCoffeeBtn) {
        this.DOM.headerCoffeeBtn.addEventListener('click', () => this.scrollToSupportSection());
    }
    
    this.initializeSpeechSynthesis();
    this.loadQuizMode(); 
    this.updateModeButtonStyles();
    this.loadQuizData(); 
    this.updateProgressDisplay(); 
    this.nextQuestion();
  },

  scrollToSupportSection() {
    const supportSection = document.querySelector('.support-me-card');
    if (supportSection) {
        supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
  
  initializeSpeechSynthesis() {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        this.speechSynthesisSupported = true;
        this.speechSynthesisUtterance = new SpeechSynthesisUtterance();

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
                console.warn('No speech synthesis voices available yet.');
            }
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial attempt to load

        // Fallback timeout if voiceschanged event doesn't fire or is delayed
        this.voiceLoadTimeoutId = window.setTimeout(() => {
            this.voiceLoadTimeoutId = null; 
            if (!this.speechSynthesisReady && this.voices.length === 0) {
                console.warn('Retrying to load voices after timeout (2s).');
                loadVoices(); 
                if (!this.speechSynthesisReady && this.voices.length === 0) {
                    console.error("Speech synthesis voices still not available after timeout.");
                    this.updateFeedback('Speech voices could not be loaded.', 'error');
                } else if (this.speechSynthesisReady) {
                     console.log('Speech synthesis voices loaded successfully after timeout.');
                }
            }
        }, 2000);

    } else {
        console.warn('Speech synthesis not supported by this browser.');
        this.updateFeedback('Speech synthesis not supported.', 'error');
        this.speechSynthesisSupported = false;
    }
  },

  loadQuizMode() {
    const savedMode = localStorage.getItem(this.localStorageKeyMode) as QuizMode | null;
    if (savedMode && (savedMode === 'letters' || savedMode === 'words')) {
        this.quizMode = savedMode;
    } else {
        this.quizMode = 'letters'; // Default
    }
  },

  saveQuizMode() {
    localStorage.setItem(this.localStorageKeyMode, this.quizMode);
  },

  switchQuizMode(newMode: QuizMode) {
    if (this.quizMode === newMode) return;
    
    this.quizMode = newMode;
    this.saveQuizMode();
    this.updateModeButtonStyles();
    
    this.loadQuizData(); 
    this.updateProgressDisplay(); 
    this.nextQuestion();
    this.updateFeedback(`Switched to ${newMode} quiz. Choose the correct option.`, 'info');
  },

  updateModeButtonStyles() {
    if (this.quizMode === 'letters') {
        this.DOM.lettersModeBtn.classList.add('active-mode');
        this.DOM.lettersModeBtn.setAttribute('aria-pressed', 'true');
        this.DOM.wordsModeBtn.classList.remove('active-mode');
        this.DOM.wordsModeBtn.setAttribute('aria-pressed', 'false');
    } else {
        this.DOM.wordsModeBtn.classList.add('active-mode');
        this.DOM.wordsModeBtn.setAttribute('aria-pressed', 'true');
        this.DOM.lettersModeBtn.classList.remove('active-mode');
        this.DOM.lettersModeBtn.setAttribute('aria-pressed', 'false');
    }
  },

  loadQuizData() {
    const currentLocalStorageKey = this.quizMode === 'letters' ? this.localStorageKeyLetters : this.localStorageKeyWords;
    const initialData = this.quizMode === 'letters' ? initialLettersData : initialWordsData;
    let useInitialData = true;
    
    const savedData = localStorage.getItem(currentLocalStorageKey);
    if (savedData) {
        try {
            const parsedSavedData: QuizItem[] = JSON.parse(savedData);
            // Basic validation: check if it's an array
            if (Array.isArray(parsedSavedData)) {
                const validSavedItems = parsedSavedData.filter(si => 
                    initialData.some(ii => ii.id === si.id) && typeof si.reviewed === 'boolean' // Add a basic check for structure
                );
                
                this.quizItems = initialData.map(initialItem => {
                    const savedVersion = validSavedItems.find(si => si.id === initialItem.id);
                    if (savedVersion) {
                         // Ensure all properties from initialItem are preserved if not in savedVersion, and SRS fields are correct type
                        return {
                            ...this.getDefaultSRDFields(), // Base SRS fields
                            ...initialItem,             // Base item data (character, transliteration, etc.)
                            ...savedVersion             // Overwrite with saved progress
                        } as QuizItem;
                    }
                    return { ...initialItem, ...this.getDefaultSRDFields() } as QuizItem;
                });
                useInitialData = false;
            } else {
                console.warn(`Invalid saved data format for ${currentLocalStorageKey}. Expected an array.`);
            }
        } catch (error) {
            console.error(`Error parsing saved data for ${currentLocalStorageKey} from localStorage:`, error);
            // Corrupted data, will fall back to initialData
        }
    }
    
    if (useInitialData) {
        this.quizItems = initialData.map(item => ({
            ...item,
            ...this.getDefaultSRDFields()
        })) as QuizItem[];
    }

    this.DOM.totalItemsCountDisplay.textContent = this.quizItems.length.toString();
    this.DOM.reviewedCountLabel.textContent = this.quizMode === 'letters' ? 'Letters Reviewed' : 'Words Reviewed';
    this.DOM.totalItemsLabel.textContent = this.quizMode === 'letters' ? 'Total Letters' : 'Total Words';
  },

  getDefaultSRDFields(): Pick<QuizItem, 'lastReviewedTimestamp' | 'nextReviewTimestamp' | 'intervalDays' | 'easeFactor' | 'correctStreak' | 'totalCorrect' | 'totalIncorrect' | 'reviewed'> {
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

  saveQuizData() {
    const currentLocalStorageKey = this.quizMode === 'letters' ? this.localStorageKeyLetters : this.localStorageKeyWords;
    localStorage.setItem(currentLocalStorageKey, JSON.stringify(this.quizItems));
  },

  selectItemForQuiz(): QuizItem | null {
    const now = Date.now();
    const dueReviewedItems = this.quizItems.filter(item => item.reviewed && item.nextReviewTimestamp <= now);
    if (dueReviewedItems.length > 0) {
        dueReviewedItems.sort((a, b) => a.nextReviewTimestamp - b.nextReviewTimestamp);
        return dueReviewedItems[0];
    }

    const newItems = this.quizItems.filter(item => !item.reviewed);
    if (newItems.length > 0) {
        return newItems[Math.floor(Math.random() * newItems.length)];
    }

    if (this.quizItems.length > 0) {
        // If all items are reviewed and none are due, pick the one reviewed longest ago to keep practicing
        const sortedByLastReviewed = [...this.quizItems].filter(item => item.reviewed).sort((a,b) => a.lastReviewedTimestamp - b.lastReviewedTimestamp);
        if (sortedByLastReviewed.length > 0) return sortedByLastReviewed[0];
    }
    
    return null;
  },

  generateOptions(correctItem: QuizItem): string[] {
    const options = new Set<string>();
    options.add(correctItem.transliteration);

    const distractors = this.quizItems.filter(item => item.id !== correctItem.id && item.transliteration !== correctItem.transliteration);
    
    const numOptions = Math.min(4, this.quizItems.length > 0 ? this.quizItems.length : 1);

    while (options.size < numOptions && distractors.length > 0) {
        const randomIndex = Math.floor(Math.random() * distractors.length);
        options.add(distractors[randomIndex].transliteration);
        distractors.splice(randomIndex, 1); 
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  handleOptionClick(selectedTransliteration: string) {
    if (!this.currentItem) return;

    this.DOM.optionsContainer.querySelectorAll('button').forEach(btn => (btn as HTMLButtonElement).disabled = true);
    this.DOM.nextQuestionBtn.style.display = 'block';

    const isCorrect = selectedTransliteration === this.currentItem.transliteration;
    const displayForm = 'character' in this.currentItem ? (this.currentItem as MalayalamLetter).displayCharacterOverride || (this.currentItem as MalayalamLetter).character : (this.currentItem as MalayalamWord).word;
    
    const currentModeStats = this.sessionStats[this.quizMode];

    if (isCorrect) {
        currentModeStats.score++;
        currentModeStats.streak++;
        this.currentItem.correctStreak++;
        this.currentItem.totalCorrect++;
        this.updateFeedback(`${displayForm} is correct! (${this.currentItem.transliteration})`, 'correct');
        
        if (this.currentItem.correctStreak === 1) this.currentItem.intervalDays = 1;
        else if (this.currentItem.correctStreak === 2) this.currentItem.intervalDays = 6;
        else this.currentItem.intervalDays = Math.ceil(this.currentItem.intervalDays * this.currentItem.easeFactor);
        this.currentItem.intervalDays = Math.min(this.currentItem.intervalDays, 365); 
        this.currentItem.easeFactor += 0.1; 

    } else {
        currentModeStats.streak = 0;
        this.currentItem.correctStreak = 0;
        this.currentItem.totalIncorrect++;
        this.updateFeedback(`Incorrect. This is ${displayForm} (${this.currentItem.transliteration}).`, 'incorrect');
        this.speakItem(this.currentItem, true); 
        this.currentItem.intervalDays = 1; 
        this.currentItem.easeFactor = Math.max(1.3, this.currentItem.easeFactor - 0.2); 
    }

    this.currentItem.lastReviewedTimestamp = Date.now();
    this.currentItem.nextReviewTimestamp = Date.now() + (this.currentItem.intervalDays * 24 * 60 * 60 * 1000);
    this.currentItem.reviewed = true;
    
    this.saveQuizData();
    this.updateProgressDisplay();
    
    this.DOM.optionsContainer.querySelectorAll('button').forEach(button => {
        const btn = button as HTMLButtonElement;
        if (btn.textContent === selectedTransliteration) {
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (btn.textContent === this.currentItem?.transliteration && !isCorrect) {
             btn.classList.add('correct'); 
        }
    });
  },

  nextQuestion() {
    this.currentItem = this.selectItemForQuiz();
    this.DOM.nextQuestionBtn.style.display = 'none';

    if (this.currentItem) {
        this.options = this.generateOptions(this.currentItem);
        this.renderQuiz();
        this.updateFeedback('Choose the correct option.', 'info');
    } else {
        this.DOM.itemDisplay.textContent = '🎉';
        this.updateFeedback('All items learned for now! Come back later for review or switch modes.', 'success');
        this.DOM.optionsContainer.innerHTML = ''; 
    }
  },
  
  renderQuiz() {
    if (!this.currentItem) return;
    const displayForm = 'character' in this.currentItem ? (this.currentItem as MalayalamLetter).displayCharacterOverride || (this.currentItem as MalayalamLetter).character : (this.currentItem as MalayalamWord).word;
    this.DOM.itemDisplay.textContent = displayForm;
    this.DOM.itemDisplay.setAttribute('aria-label', `Quiz item: ${displayForm}`);

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
    if (!this.speechSynthesisReady) {
        console.warn('Cannot speak: Speech synthesis voices are not ready or available.'); // Changed from error to warn
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

    let selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN' && voice.localService); // Prefer local voices
    if (!selectedVoice) {
        selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN');
    }
    if (!selectedVoice) {
        selectedVoice = this.voices.find(voice => voice.lang.startsWith('ml-') && voice.localService);
    }
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
        } else if (event.error === 'synthesis-failed' || event.error === 'audio-busy' || event.error === 'synthesis-unavailable') {
             errorMsg += ` Try again or refresh.`;
        }
        this.updateFeedback(errorMsg, 'error');
    };

    window.speechSynthesis.speak(utterance);
  },

  speakItem(item: QuizItem, emphatic: boolean = false) {
    let textToSpeak: string;
    if ('character' in item) { // It's a MalayalamLetter
        const letter = item as MalayalamLetter;
        if (letter.audioOverride) {
            textToSpeak = letter.audioOverride;
        } else if (letter.category === 'matra' && letter.displayCharacterOverride) {
            // For matras, we want to speak the example character with the matra
            // This might need refinement if displayCharacterOverride isn't always speakable
            textToSpeak = letter.displayCharacterOverride; 
        } else {
            textToSpeak = letter.character;
        }
    } else { // It's a MalayalamWord
        textToSpeak = (item as MalayalamWord).word;
    }
    this.speak(textToSpeak, 'ml-IN', emphatic ? 0.85 : 0.95, emphatic ? 1.0 : 1.1);
  },
  
  updateFeedback(message: string, type: 'info' | 'error' | 'success' | 'correct' | 'incorrect') {
    this.DOM.feedbackArea.textContent = message;
    this.DOM.feedbackArea.className = `feedback ${type}`;
  },

  updateProgressDisplay() {
    const currentModeStats = this.sessionStats[this.quizMode];
    this.DOM.scoreDisplay.textContent = currentModeStats.score.toString();
    this.DOM.correctStreakDisplay.textContent = currentModeStats.streak.toString();
    this.DOM.reviewedCountDisplay.textContent = this.quizItems.filter(item => item.reviewed).length.toString(); 
  }
  
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
        // Fallback for environments where document.fonts might not be available or behave unexpectedly
        console.warn('document.fonts API not available. Initializing app directly.');
        App.init();
    }
});

