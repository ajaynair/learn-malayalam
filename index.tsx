import { GoogleGenAI } from "@google/genai"; // Added as per instructions, though not used in this diff. Assume it's for future use.

// Define types previously in lettersData.ts and wordsData.ts
interface InitialLetter {
    id: string;
    character: string;
    displayCharacterOverride?: string;
    category: 'vowel' | 'consonant' | 'chillu' | 'kootaksharam' | 'matra';
    transliteration: string;
}

interface InitialWord {
    id: string;
    word: string;
    transliteration: string;
}

// Runtime QuizItem including SRS fields
type QuizItem = (InitialLetter | InitialWord) & {
    lastReviewedTimestamp: number;
    nextReviewTimestamp: number;
    intervalDays: number;
    easeFactor: number;
    correctStreak: number;
    totalCorrect: number;
    totalIncorrect: number;
    reviewed: boolean;
    // Optional type guards/fields for easier differentiation
    character?: string; // Present for letters
    word?: string;      // Present for words
};

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
    localStorageKeyMute: 'malayalamAppMuteState_v1',


    voices: [] as SpeechSynthesisVoice[],
    speechSynthesisReady: false,
    speechSynthesisSupported: false,
    speechSynthesisUtterance: null as SpeechSynthesisUtterance | null,
    voiceLoadTimeoutId: null as number | null,
    currentAudioElement: null as HTMLAudioElement | null,
    isMuted: false,


    shareDetails: {
        title: 'Learn Malayalam Free: Letters, Alphabet & Words | Interactive Quiz',
        text: 'Discover the fun, free way to learn the Malayalam alphabet and words with this interactive quiz app! Master the script with audio, spaced repetition, and engaging exercises.',
        url: 'https://www.learn-malayalam.org/'
    },

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
        headerShareBtn: document.getElementById('header-share-btn') as HTMLButtonElement,
        muteToggleBtn: document.getElementById('mute-toggle-btn') as HTMLButtonElement,
        shareModal: document.getElementById('share-modal') as HTMLDivElement,
        shareModalCloseBtn: document.getElementById('share-modal-close-btn') as HTMLButtonElement,
        shareUrlInput: document.getElementById('share-url-input') as HTMLInputElement,
        copyUrlBtn: document.getElementById('copy-url-btn') as HTMLButtonElement,
        shareTwitter: document.getElementById('share-twitter') as HTMLAnchorElement,
        shareFacebook: document.getElementById('share-facebook') as HTMLAnchorElement,
        shareWhatsApp: document.getElementById('share-whatsapp') as HTMLAnchorElement,
        shareLinkedIn: document.getElementById('share-linkedin') as HTMLAnchorElement,
        shareEmail: document.getElementById('share-email') as HTMLAnchorElement,
    },

    async init() {
        this.DOM.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.DOM.lettersModeBtn.addEventListener('click', () => this.switchQuizMode('letters'));
        this.DOM.wordsModeBtn.addEventListener('click', () => this.switchQuizMode('words'));
        if(this.DOM.headerCoffeeBtn) {
            this.DOM.headerCoffeeBtn.addEventListener('click', () => this.scrollToSupportSection());
        }
        if(this.DOM.headerShareBtn) {
            this.DOM.headerShareBtn.addEventListener('click', () => this.handleShare());
        }
        if(this.DOM.muteToggleBtn) {
            this.DOM.muteToggleBtn.addEventListener('click', () => this.toggleMute());
        }
        if(this.DOM.shareModalCloseBtn) {
            this.DOM.shareModalCloseBtn.addEventListener('click', () => this.closeShareModal());
        }
        if(this.DOM.copyUrlBtn) {
            this.DOM.copyUrlBtn.addEventListener('click', () => this.copyShareUrl());
        }

        this.initializeSpeechSynthesis(); // For general TTS, not item pronunciation
        this.loadMuteState();
        this.updateMuteButtonAppearance();
        this.loadQuizMode();
        this.updateModeButtonStyles();
        await this.loadQuizData();
        this.updateProgressDisplay();
        this.nextQuestion();

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.DOM.shareModal.style.display === 'flex') {
                this.closeShareModal();
            }
        });
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
                    console.log('Speech synthesis voices loaded successfully (for UI feedback).');
                } else {
                    // console.warn('No speech synthesis voices available yet (for UI feedback).'); // Less verbose
                }
            };

            window.speechSynthesis.onvoiceschanged = loadVoices;
            loadVoices();

            this.voiceLoadTimeoutId = window.setTimeout(() => {
                this.voiceLoadTimeoutId = null;
                if (!this.speechSynthesisReady && this.voices.length === 0) {
                    console.warn('Retrying to load voices after timeout (2s) (for UI feedback).');
                    loadVoices();
                    if (!this.speechSynthesisReady && this.voices.length === 0) {
                        console.error("Speech synthesis voices still not available after timeout (for UI feedback).");
                    } else if (this.speechSynthesisReady) {
                        console.log('Speech synthesis voices loaded successfully after timeout (for UI feedback).');
                    }
                }
            }, 2000);

        } else {
            console.warn('Speech synthesis not supported by this browser (for UI feedback).');
            this.speechSynthesisSupported = false;
        }
    },

    loadMuteState() {
        const savedMuteState = localStorage.getItem(this.localStorageKeyMute);
        if (savedMuteState === 'true') {
            this.isMuted = true;
        } else if (savedMuteState === 'false') {
            this.isMuted = false;
        } else {
            this.isMuted = false; // Default to unmuted if no valid state found
        }
    },

    saveMuteState() {
        localStorage.setItem(this.localStorageKeyMute, this.isMuted.toString());
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveMuteState();
        this.updateMuteButtonAppearance();

        if (this.isMuted) {
            // Stop any currently playing audio
            if (this.currentAudioElement) {
                this.currentAudioElement.pause();
                this.currentAudioElement.currentTime = 0;
                // Don't nullify here, speakItem will handle it or a new sound will replace it
            }
            if (this.speechSynthesisSupported && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
        // Optional: play a small sound cue for mute/unmute if not muted.
    },

    updateMuteButtonAppearance() {
        if (!this.DOM.muteToggleBtn) return;

        const iconSpan = this.DOM.muteToggleBtn.querySelector('.mute-icon');
        const textSpan = this.DOM.muteToggleBtn.querySelector('.mute-text');

        if (this.isMuted) {
            if (iconSpan) iconSpan.textContent = '🔇';
            if (textSpan) textSpan.textContent = 'Unmute';
            this.DOM.muteToggleBtn.setAttribute('aria-label', 'Unmute audio');
            this.DOM.muteToggleBtn.setAttribute('aria-pressed', 'true');
            this.DOM.muteToggleBtn.classList.add('muted');
        } else {
            if (iconSpan) iconSpan.textContent = '🔊';
            if (textSpan) textSpan.textContent = 'Mute';
            this.DOM.muteToggleBtn.setAttribute('aria-label', 'Mute audio');
            this.DOM.muteToggleBtn.setAttribute('aria-pressed', 'false');
            this.DOM.muteToggleBtn.classList.remove('muted');
        }
    },

    async handleShare() {
        if (navigator.share) {
            try {
                await navigator.share(this.shareDetails);
                console.log('Content shared successfully via Web Share API');
                this.updateFeedback('Link shared!', 'success');
            } catch (error: unknown) {
                console.error('Error sharing via Web Share API:', error);
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.log('Share action aborted by user.');
                } else if (error instanceof Error) {
                    this.updateFeedback(`Could not share: ${error.message}. Try copying the link.`, 'error');
                    this.openShareModal();
                } else {
                    this.updateFeedback('Could not share due to an unknown error. Try copying the link.', 'error');
                    this.openShareModal();
                }
            }
        } else {
            this.openShareModal();
        }
    },

    openShareModal() {
        this.DOM.shareUrlInput.value = this.shareDetails.url;
        this.configureSocialShareLinks();
        this.DOM.shareModal.style.display = 'flex';
        this.DOM.shareModal.setAttribute('aria-hidden', 'false');
        this.DOM.headerShareBtn.setAttribute('aria-expanded', 'true');
        this.DOM.shareModalCloseBtn.focus();
    },

    closeShareModal() {
        this.DOM.shareModal.style.display = 'none';
        this.DOM.shareModal.setAttribute('aria-hidden', 'true');
        this.DOM.headerShareBtn.setAttribute('aria-expanded', 'false');
        this.DOM.headerShareBtn.focus();
    },

    async copyShareUrl() {
        try {
            await navigator.clipboard.writeText(this.DOM.shareUrlInput.value);
            this.updateFeedback('URL copied to clipboard!', 'success');
            const originalText = this.DOM.copyUrlBtn.textContent;
            this.DOM.copyUrlBtn.textContent = 'Copied!';
            this.DOM.copyUrlBtn.disabled = true;
            setTimeout(() => {
                this.DOM.copyUrlBtn.textContent = originalText;
                this.DOM.copyUrlBtn.disabled = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy URL: ', err);
            this.updateFeedback('Failed to copy URL.', 'error');
        }
    },

    configureSocialShareLinks() {
        const title = encodeURIComponent(this.shareDetails.title);
        const text = encodeURIComponent(this.shareDetails.text);
        const shortTextForTwitter = encodeURIComponent(this.shareDetails.title);
        const url = encodeURIComponent(this.shareDetails.url);

        this.DOM.shareTwitter.href = `https://twitter.com/intent/tweet?text=${shortTextForTwitter}&url=${url}`;
        this.DOM.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        this.DOM.shareWhatsApp.href = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        this.DOM.shareLinkedIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        this.DOM.shareEmail.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
    },

    loadQuizMode() {
        const savedMode = localStorage.getItem(this.localStorageKeyMode) as QuizMode | null;
        if (savedMode && (savedMode === 'letters' || savedMode === 'words')) {
            this.quizMode = savedMode;
        } else {
            this.quizMode = 'letters';
        }
    },

    saveQuizMode() {
        localStorage.setItem(this.localStorageKeyMode, this.quizMode);
    },

    async switchQuizMode(newMode: QuizMode) {
        if (this.quizMode === newMode) return;

        this.quizMode = newMode;
        this.saveQuizMode();
        this.updateModeButtonStyles();

        await this.loadQuizData();
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

    async loadQuizData() {
        const currentLocalStorageKey = this.quizMode === 'letters' ? this.localStorageKeyLetters : this.localStorageKeyWords;
        // Paths are relative to the public directory, which is served at the root
        const dataPath = this.quizMode === 'letters' ? './lettersData.json' : './wordsData.json';

        let fetchedInitialData: (InitialLetter[] | InitialWord[]) = [];
        try {
            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${dataPath}: ${response.status} ${response.statusText}`);
            }
            fetchedInitialData = await response.json();
            if (!Array.isArray(fetchedInitialData)) {
                throw new Error(`Data from ${dataPath} is not an array.`);
            }
        } catch (fetchError) {
            console.error(`Error fetching or parsing initial quiz data from ${dataPath}:`, fetchError);
            this.updateFeedback(`Could not load ${this.quizMode} data. Please check your connection or refresh.`, 'error');
            this.quizItems = []; // Ensure quizItems is empty if data load fails
            this.DOM.totalItemsCountDisplay.textContent = '0';
            this.DOM.reviewedCountDisplay.textContent = '0';
            return;
        }

        let useInitialDataStructure = true;
        const savedData = localStorage.getItem(currentLocalStorageKey);

        if (savedData) {
            try {
                const parsedSavedData: QuizItem[] = JSON.parse(savedData);
                if (Array.isArray(parsedSavedData)) {
                    // Filter out saved items that no longer exist in the fetched initial data
                    const validSavedItems = parsedSavedData.filter(si =>
                        fetchedInitialData.some(ii => ii.id === si.id) && typeof si.reviewed === 'boolean'
                    );

                    this.quizItems = fetchedInitialData.map(initialItem => {
                        const savedVersion = validSavedItems.find(si => si.id === initialItem.id);
                        if (savedVersion) {
                            // Merge, prioritizing saved SRS fields but ensuring core data is from fetchedInitialData
                            return {
                                ...initialItem, // Core data from JSON
                                ...this.getDefaultSRDFields(), // Default SRS structure
                                ...savedVersion, // Overwrite with saved SRS fields
                                // Ensure core properties from initialItem are not overwritten by potentially stale saved versions
                                ...(initialItem as InitialLetter).character && { character: (initialItem as InitialLetter).character },
                                ...(initialItem as InitialWord).word && { word: (initialItem as InitialWord).word },
                                transliteration: initialItem.transliteration,
                                category: (initialItem as InitialLetter).category,
                                displayCharacterOverride: (initialItem as InitialLetter).displayCharacterOverride,
                            } as QuizItem;
                        }
                        return { ...initialItem, ...this.getDefaultSRDFields() } as QuizItem;
                    });
                    useInitialDataStructure = false;
                } else {
                    console.warn(`Invalid saved data format for ${currentLocalStorageKey}. Expected an array. Using fresh data.`);
                }
            } catch (error) {
                console.error(`Error parsing saved data for ${currentLocalStorageKey} from localStorage:`, error);
            }
        }

        if (useInitialDataStructure) {
            this.quizItems = fetchedInitialData.map(item => ({
                ...item,
                ...this.getDefaultSRDFields()
            })) as QuizItem[];
        }

        this.DOM.totalItemsCountDisplay.textContent = this.quizItems.length.toString();
        this.DOM.reviewedCountLabel.textContent = this.quizMode === 'letters' ? 'Letters Reviewed' : 'Words Reviewed';
        this.DOM.totalItemsLabel.textContent = this.quizMode === 'letters' ? 'Total Letters' : 'Total Words';
        this.updateProgressDisplay(); // Update reviewed count too
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
        const displayForm = this.currentItem.character ? ((this.currentItem as InitialLetter).displayCharacterOverride || (this.currentItem as InitialLetter).character) : (this.currentItem as InitialWord).word;

        const currentModeStats = this.sessionStats[this.quizMode];

        if (isCorrect) {
            currentModeStats.score++;
            currentModeStats.streak++;
            this.currentItem.correctStreak++;
            this.currentItem.totalCorrect++;
            this.updateFeedback(`${displayForm} is correct! (${this.currentItem.transliteration})`, 'correct');
            this.speakItem(this.currentItem, false); // Play audio on correct, non-emphatic

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
            this.speakItem(this.currentItem, true); // Play audio on incorrect, emphatic (though emphatic flag not currently used by MP3 logic)

            if (navigator.vibrate) {
                navigator.vibrate(200); // Vibrate for 200ms on incorrect answer
            }

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
            // Optionally, play audio for the new item automatically when it appears
            // this.speakItem(this.currentItem); // Uncomment if desired
        } else {
            this.DOM.itemDisplay.textContent = '🎉';
            this.updateFeedback(this.quizItems.length > 0 ? 'All items learned for now! Come back later for review or switch modes.' : 'No items loaded. Check data files or connection.', this.quizItems.length > 0 ? 'success' : 'error');
            this.DOM.optionsContainer.innerHTML = '';
        }
    },

    renderQuiz() {
        if (!this.currentItem) return;
        const displayForm = this.currentItem.character ? ((this.currentItem as InitialLetter).displayCharacterOverride || (this.currentItem as InitialLetter).character) : (this.currentItem as InitialWord).word;
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

    // General purpose TTS for UI feedback
    speak(text: string, lang: string = 'ml-IN', rate: number = 0.9, pitch: number = 1.1) {
        if (this.isMuted) return; // Respect mute state
        if (!this.speechSynthesisSupported || !this.speechSynthesisUtterance) {
            // console.warn('Speech synthesis not initialized or not supported (for UI feedback).'); // Less verbose
            return;
        }
        if (!this.speechSynthesisReady) {
            // console.warn('Cannot speak (UI feedback): Speech synthesis voices are not ready or available.');// Less verbose
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); // Stop previous UI speech before starting new
        }

        const utterance = this.speechSynthesisUtterance;
        utterance.text = text;
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.voice = null;

        let selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN' && voice.localService);
        if (!selectedVoice) selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN');
        if (!selectedVoice) selectedVoice = this.voices.find(voice => voice.lang.startsWith('ml-') && voice.localService);
        if (!selectedVoice) selectedVoice = this.voices.find(voice => voice.lang.startsWith('ml-'));

        if (selectedVoice) utterance.voice = selectedVoice;
        else console.warn(`Malayalam voice not found for UI feedback. Using browser default for lang '${lang}'.`);

        utterance.onerror = (event) => {
            console.error('Speech synthesis error (UI feedback):', event.error, event);
        };

        window.speechSynthesis.speak(utterance);
    },

    // Audio for item pronunciation (MP3)
    async speakItem(item: QuizItem, emphatic: boolean = false) {
        if (this.isMuted) return; // Respect mute state
        if (!item) return;

        // Stop any currently playing audio (MP3 or TTS)
        if (this.currentAudioElement) {
            this.currentAudioElement.pause();
            this.currentAudioElement.removeAttribute('src'); // Detach source
            this.currentAudioElement.load(); // Reset element state
            this.currentAudioElement = null;
        }
        if (this.speechSynthesisSupported && window.speechSynthesis.speaking) { // Stop UI speech too
            window.speechSynthesis.cancel();
        }


        const audioType = item.character ? 'letters' : 'words';
        const audioPath = `./audio/${audioType}/${item.id}.mp3`;

        const audioElement = new Audio();
        this.currentAudioElement = audioElement;

        const playPromise = new Promise<void>((resolve, reject) => {
            const timeoutDuration = 5000;
            let loadTimeoutId: number | null = null;

            const cleanup = () => {
                if (loadTimeoutId !== null) clearTimeout(loadTimeoutId);
                audioElement.oncanplaythrough = null;
                audioElement.onerror = null;
                audioElement.onended = null;
                audioElement.onabort = null;
                if (this.currentAudioElement === audioElement) { // Only nullify if it's still the active one
                    this.currentAudioElement = null;
                }
            };

            audioElement.oncanplaythrough = () => {
                cleanup();
                resolve();
            };
            audioElement.onerror = (e) => {
                console.warn(`Custom audio error for item ID ${item.id} at path ${audioPath}:`, audioElement.error, e);
                cleanup();
                reject(new Error(`Audio not found or error for ${item.id}`));
            };
            audioElement.onended = cleanup; // Cleanup when audio finishes naturally
            audioElement.onabort = cleanup; // Cleanup if aborted (e.g. by new audio)

            loadTimeoutId = window.setTimeout(() => {
                console.warn(`Audio load timeout for item ID ${item.id} at path ${audioPath}`);
                cleanup();
                reject(new Error(`Audio load timeout for ${item.id}`));
            }, timeoutDuration);

            audioElement.src = audioPath;
            audioElement.load();
        });

        try {
            await playPromise;
            // The `emphatic` parameter is not currently used for MP3 playback rate.
            // audioElement.playbackRate = emphatic ? 0.9 : 1.0; // If you want to use it
            audioElement.play().catch(playError => {
                console.error(`Error playing custom audio for item ID ${item.id}:`, playError);
                if (this.currentAudioElement === audioElement) {
                    this.currentAudioElement = null;
                }
            });
        } catch (error) {
            console.log(`No custom audio will be played for item ID ${item.id}. Error: ${(error as Error).message}`);
            if (this.currentAudioElement === audioElement) { // Ensure cleanup if playPromise rejected
                this.currentAudioElement = null;
            }
        }
    },

    updateFeedback(message: string, type: 'info' | 'error' | 'success' | 'correct' | 'incorrect') {
        this.DOM.feedbackArea.textContent = message;
        this.DOM.feedbackArea.className = `feedback ${type}`;
        // Optionally speak error messages using general TTS, respecting mute
        // if (type === 'error' && !this.isMuted && this.speechSynthesisSupported && this.speechSynthesisReady) {
        //   this.speak(message, 'en-US');
        // }
    },

    updateProgressDisplay() {
        const currentModeStats = this.sessionStats[this.quizMode];
        this.DOM.scoreDisplay.textContent = currentModeStats.score.toString();
        this.DOM.correctStreakDisplay.textContent = currentModeStats.streak.toString();
        const reviewedItemsCount = this.quizItems.filter(item => item.reviewed).length;
        this.DOM.reviewedCountDisplay.textContent = reviewedItemsCount.toString();
        this.DOM.totalItemsCountDisplay.textContent = this.quizItems.length.toString();
    }

};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof document !== 'undefined' && document.fonts) {
            await Promise.all([
                document.fonts.load('1em "Noto Sans Malayalam"'),
                document.fonts.load('1em "Noto Sans"')
            ]);
            console.log("Fonts loaded successfully.");
        } else {
            console.warn('document.fonts API not available. Proceeding without font load confirmation.');
        }
    } catch (err) {
        console.warn('Required fonts could not be loaded or confirmed, initializing app anyway.', err);
    } finally {
        await App.init();
        console.log("App initialized.");
    }
});