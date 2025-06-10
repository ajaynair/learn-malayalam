
import { LOCAL_STORAGE_KEYS, SHARE_DETAILS } from './constants.ts';
import type { ShareDetails } from './constants.ts'; // Import type if needed elsewhere
import {
    loadCelebratedModes,
    saveCelebratedModes,
    playCelebrationAnimation,
    openHallOfFameModal,
    closeHallOfFameModal,
    submitTestimonial,
    checkCompletionAndCelebrate,
    setupHallOfFameEventListeners
} from './src/hallOfFame.ts';

// Define types previously in lettersData.ts and wordsData.ts
interface InitialLetter {
    id: string;
    character: string;
    displayCharacterOverride?: string;
    category: 'vowel' | 'consonant' | 'chillu' | 'kootaksharam' | 'matra';
    transliteration: string;
}

interface InitialWord {
    id:string;
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

export interface CelebratedModes { // Export if needed by hallOfFame.ts directly, though it's part of AppType
    letters: boolean;
    words: boolean;
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
    celebratedModes: {
        letters: false,
        words: false,
    } as CelebratedModes,

    voices: [] as SpeechSynthesisVoice[],
    speechSynthesisReady: false,
    speechSynthesisSupported: false,
    speechSynthesisUtterance: null as SpeechSynthesisUtterance | null,
    voiceLoadTimeoutId: null as number | null,
    currentAudioElement: null as HTMLAudioElement | null,
    isMuted: false,

    DOM: {
        itemDisplay: document.getElementById('item-display')!,
        replayItemAudioBtn: document.getElementById('replay-item-audio-btn') as HTMLButtonElement,
        answerFeedbackIcon: document.getElementById('answer-feedback-icon') as HTMLSpanElement,
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

        headerAboutBtn: document.getElementById('header-about-btn') as HTMLButtonElement,
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

        aboutMeModal: document.getElementById('about-me-modal') as HTMLDivElement,
        aboutMeModalCloseBtn: document.getElementById('about-me-modal-close-btn') as HTMLButtonElement,

        quizProgressBarContainer: document.getElementById('quiz-progress-bar-container') as HTMLDivElement,
        quizProgressBar: document.getElementById('quiz-progress-bar') as HTMLDivElement,
        progressBarLabelText: document.getElementById('progress-bar-label-text') as HTMLSpanElement,

        confettiContainer: document.getElementById('confetti-container') as HTMLDivElement,
        hallOfFameModal: document.getElementById('hall-of-fame-modal') as HTMLDivElement,
        hallOfFameModalCloseBtn: document.getElementById('hall-of-fame-modal-close-btn') as HTMLButtonElement,
        hallOfFameNameInput: document.getElementById('hall-of-fame-name-input') as HTMLInputElement,
        hallOfFameEmailInput: document.getElementById('hall-of-fame-email-input') as HTMLInputElement,
        hallOfFameTestimonialInput: document.getElementById('hall-of-fame-testimonial-input') as HTMLTextAreaElement,
        submitTestimonialBtn: document.getElementById('submit-testimonial-btn') as HTMLButtonElement,
        testHofBtn: document.getElementById('test-hof-btn') as HTMLButtonElement,
    },

    async init() {
        this.DOM.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.DOM.lettersModeBtn.addEventListener('click', () => this.switchQuizMode('letters'));
        this.DOM.wordsModeBtn.addEventListener('click', () => this.switchQuizMode('words'));

        if(this.DOM.headerAboutBtn) {
            this.DOM.headerAboutBtn.addEventListener('click', () => this.openAboutMeModal());
        }
        if(this.DOM.headerCoffeeBtn) {
            this.DOM.headerCoffeeBtn.addEventListener('click', () => this.scrollToSupportSection());
        }
        if(this.DOM.headerShareBtn) {
            this.DOM.headerShareBtn.addEventListener('click', () => this.handleShare());
        }
        if(this.DOM.muteToggleBtn) {
            this.DOM.muteToggleBtn.addEventListener('click', () => this.toggleMute());
        }
        if(this.DOM.replayItemAudioBtn) {
            this.DOM.replayItemAudioBtn.addEventListener('click', () => {
                if (this.currentItem) {
                    this.speakItem(this.currentItem, false, true); // bypassMute = true
                }
            });
        }
        if(this.DOM.shareModalCloseBtn) {
            this.DOM.shareModalCloseBtn.addEventListener('click', () => this.closeShareModal());
        }
        if(this.DOM.copyUrlBtn) {
            this.DOM.copyUrlBtn.addEventListener('click', () => this.copyShareUrl());
        }
        if(this.DOM.aboutMeModalCloseBtn) {
            this.DOM.aboutMeModalCloseBtn.addEventListener('click', () => this.closeAboutMeModal());
        }

        setupHallOfFameEventListeners(this, this.DOM); // Moved HoF event listeners here

        this.initializeSpeechSynthesis();
        this.loadMuteState();
        this.updateMuteButtonAppearance();
        this.loadQuizMode();
        this.loadSessionStats();
        loadCelebratedModes(this); // Use imported function
        this.updateModeButtonStyles();
        await this.loadQuizData();
        this.updateProgressDisplay();
        this.nextQuestion();

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.DOM.shareModal.style.display === 'flex') {
                    this.closeShareModal();
                }
                if (this.DOM.aboutMeModal.style.display === 'flex') {
                    this.closeAboutMeModal();
                }
                if (this.DOM.hallOfFameModal.style.display === 'flex') {
                    closeHallOfFameModal(this.DOM); // Use imported function
                }
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
                }
            };

            window.speechSynthesis.onvoiceschanged = loadVoices;
            loadVoices();

            this.voiceLoadTimeoutId = window.setTimeout(() => {
                this.voiceLoadTimeoutId = null;
                if (!this.speechSynthesisReady && this.voices.length === 0) {
                    loadVoices();
                    if (!this.speechSynthesisReady && this.voices.length === 0) {
                        console.error("Speech synthesis voices still not available after timeout (for UI feedback).");
                    }
                }
            }, 2000);

        } else {
            console.warn('Speech synthesis not supported by this browser (for UI feedback).');
            this.speechSynthesisSupported = false;
        }
    },

    loadMuteState() {
        const savedMuteState = localStorage.getItem(LOCAL_STORAGE_KEYS.mute);
        if (savedMuteState === 'true') {
            this.isMuted = true;
        } else if (savedMuteState === 'false') {
            this.isMuted = false;
        } else {
            this.isMuted = false;
        }
    },

    saveMuteState() {
        localStorage.setItem(LOCAL_STORAGE_KEYS.mute, this.isMuted.toString());
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveMuteState();
        this.updateMuteButtonAppearance();

        if (this.isMuted) {
            if (this.speechSynthesisSupported && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            if (this.currentAudioElement) {
                this.currentAudioElement.pause();
            }
        }
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
                await navigator.share(SHARE_DETAILS);
                this.updateFeedback('Link shared!', 'success');
            } catch (error: unknown) {
                console.error('Error sharing via Web Share API:', error);
                if (error instanceof DOMException && error.name === 'AbortError') {
                    // User aborted share
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
        this.DOM.shareUrlInput.value = SHARE_DETAILS.url;
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

    openAboutMeModal() {
        this.DOM.aboutMeModal.style.display = 'flex';
        this.DOM.aboutMeModal.setAttribute('aria-hidden', 'false');
        if (this.DOM.headerAboutBtn) {
            this.DOM.headerAboutBtn.setAttribute('aria-expanded', 'true');
        }
        this.DOM.aboutMeModalCloseBtn.focus();
    },

    closeAboutMeModal() {
        this.DOM.aboutMeModal.style.display = 'none';
        this.DOM.aboutMeModal.setAttribute('aria-hidden', 'true');
        if (this.DOM.headerAboutBtn) {
            this.DOM.headerAboutBtn.setAttribute('aria-expanded', 'false');
            this.DOM.headerAboutBtn.focus();
        }
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
        const title = encodeURIComponent(SHARE_DETAILS.title);
        const text = encodeURIComponent(SHARE_DETAILS.text);
        const shortTextForTwitter = encodeURIComponent(SHARE_DETAILS.title);
        const url = encodeURIComponent(SHARE_DETAILS.url);

        this.DOM.shareTwitter.href = `https://twitter.com/intent/tweet?text=${shortTextForTwitter}&url=${url}`;
        this.DOM.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        this.DOM.shareWhatsApp.href = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        this.DOM.shareLinkedIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        this.DOM.shareEmail.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
    },

    loadQuizMode() {
        const savedMode = localStorage.getItem(LOCAL_STORAGE_KEYS.mode) as QuizMode | null;
        if (savedMode && (savedMode === 'letters' || savedMode === 'words')) {
            this.quizMode = savedMode;
        } else {
            this.quizMode = 'letters';
        }
    },

    saveQuizMode() {
        localStorage.setItem(LOCAL_STORAGE_KEYS.mode, this.quizMode);
    },

    loadSessionStats() {
        const savedStats = localStorage.getItem(LOCAL_STORAGE_KEYS.sessionStats);
        const defaultStats = {
            letters: { score: 0, streak: 0 },
            words: { score: 0, streak: 0 },
        };

        if (savedStats) {
            try {
                const parsedStats = JSON.parse(savedStats);
                if (parsedStats && parsedStats.letters && parsedStats.words &&
                    typeof parsedStats.letters.score === 'number' &&
                    typeof parsedStats.letters.streak === 'number' &&
                    typeof parsedStats.words.score === 'number' &&
                    typeof parsedStats.words.streak === 'number') {
                    this.sessionStats = parsedStats;
                    return;
                } else {
                    console.warn('Invalid session stats format in localStorage. Using defaults.');
                }
            } catch (error) {
                console.error('Error parsing session stats from localStorage:', error);
            }
        }
        this.sessionStats = defaultStats;
    },

    saveSessionStats() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.sessionStats, JSON.stringify(this.sessionStats));
        } catch (error) {
            console.error('Error saving session stats to localStorage:', error);
        }
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
        const currentLocalStorageKey = this.quizMode === 'letters' ? LOCAL_STORAGE_KEYS.letters : LOCAL_STORAGE_KEYS.words;
        const dataPath = this.quizMode === 'letters' ? '/lettersData.json' : '/wordsData.json';

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
            this.quizItems = [];
            this.DOM.totalItemsCountDisplay.textContent = '0';
            this.DOM.reviewedCountDisplay.textContent = '0';
            if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'none';
            if (this.DOM.answerFeedbackIcon) this.DOM.answerFeedbackIcon.style.display = 'none';
            this.updateProgressDisplay();
            return;
        }

        let useInitialDataStructure = true;
        const savedData = localStorage.getItem(currentLocalStorageKey);

        if (savedData) {
            try {
                const parsedSavedData: QuizItem[] = JSON.parse(savedData);
                if (Array.isArray(parsedSavedData)) {
                    const validSavedItems = parsedSavedData.filter(si =>
                        fetchedInitialData.some(ii => ii.id === si.id) && typeof si.reviewed === 'boolean'
                    );

                    this.quizItems = fetchedInitialData.map(initialItem => {
                        const savedVersion = validSavedItems.find(si => si.id === initialItem.id);
                        if (savedVersion) {
                            return {
                                ...initialItem,
                                ...this.getDefaultSRDFields(),
                                ...savedVersion,
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
        this.updateProgressDisplay();
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
        const currentLocalStorageKey = this.quizMode === 'letters' ? LOCAL_STORAGE_KEYS.letters : LOCAL_STORAGE_KEYS.words;
        try {
            localStorage.setItem(currentLocalStorageKey, JSON.stringify(this.quizItems));
        } catch (error) {
            console.error(`Error saving quiz data for ${this.quizMode} to localStorage:`, error);
        }
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
        this.DOM.nextQuestionBtn.style.display = 'inline-block'; // Changed to inline-block for centering

        const isCorrect = selectedTransliteration === this.currentItem.transliteration;

        const currentModeStats = this.sessionStats[this.quizMode];

        if (this.DOM.answerFeedbackIcon) {
            if (isCorrect) {
                this.DOM.answerFeedbackIcon.textContent = '✔';
                this.DOM.answerFeedbackIcon.style.color = '#2e73b8';
                this.DOM.answerFeedbackIcon.setAttribute('aria-label', 'Correct');
            } else {
                this.DOM.answerFeedbackIcon.textContent = '✖';
                this.DOM.answerFeedbackIcon.style.color = '#d9534f';
                this.DOM.answerFeedbackIcon.setAttribute('aria-label', 'Incorrect');
            }
            this.DOM.answerFeedbackIcon.style.display = 'inline';
        }


        if (isCorrect) {
            currentModeStats.score++;
            currentModeStats.streak++;
            this.currentItem.correctStreak++;
            this.currentItem.totalCorrect++;
            this.speakItem(this.currentItem, false, false);

            if (this.currentItem.correctStreak === 1) this.currentItem.intervalDays = 1;
            else if (this.currentItem.correctStreak === 2) this.currentItem.intervalDays = 6;
            else this.currentItem.intervalDays = Math.ceil(this.currentItem.intervalDays * this.currentItem.easeFactor);
            this.currentItem.intervalDays = Math.min(this.currentItem.intervalDays, 365);
            this.currentItem.easeFactor += 0.1;

        } else {
            currentModeStats.streak = 0;
            this.currentItem.correctStreak = 0;
            this.currentItem.totalIncorrect++;
            this.speakItem(this.currentItem, true, false);

            if (navigator.vibrate) {
                navigator.vibrate(200);
            }

            this.currentItem.intervalDays = 1;
            this.currentItem.easeFactor = Math.max(1.3, this.currentItem.easeFactor - 0.2);
        }

        this.currentItem.lastReviewedTimestamp = Date.now();
        this.currentItem.nextReviewTimestamp = Date.now() + (this.currentItem.intervalDays * 24 * 60 * 60 * 1000);
        this.currentItem.reviewed = true;

        this.saveQuizData();
        this.saveSessionStats();
        this.updateProgressDisplay();
        checkCompletionAndCelebrate(this); // Use imported function

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

        if (this.DOM.answerFeedbackIcon) {
            this.DOM.answerFeedbackIcon.style.display = 'none';
            this.DOM.answerFeedbackIcon.textContent = '';
            this.DOM.answerFeedbackIcon.removeAttribute('aria-label');
        }

        if (this.currentItem) {
            this.options = this.generateOptions(this.currentItem);
            this.renderQuiz();
            this.updateFeedback('Choose the correct option.', 'info');
            if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'inline-flex';
        } else {
            this.DOM.itemDisplay.textContent = '🎉';
            if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'none';

            const allReviewed = this.quizItems.length > 0 && this.quizItems.every(item => item.reviewed);
            if (allReviewed && this.quizItems.length > 0 && !this.celebratedModes[this.quizMode]) {
                this.updateFeedback('All items learned! Preparing your celebration...', 'success');
                checkCompletionAndCelebrate(this);  // Use imported function
            } else if (allReviewed && this.quizItems.length > 0) {
                this.updateFeedback('All items reviewed for now! Come back later or switch modes.', 'success');
            } else {
                this.updateFeedback(this.quizItems.length > 0 ? 'All items learned for now! Come back later for review or switch modes.' : 'No items loaded. Check data files or connection.', this.quizItems.length > 0 ? 'success' : 'error');
            }
            this.DOM.optionsContainer.innerHTML = '';
        }
    },

    renderQuiz() {
        if (!this.currentItem) return;
        const displayForm = this.currentItem.character ? ((this.currentItem as InitialLetter).displayCharacterOverride || (this.currentItem as InitialLetter).character) : (this.currentItem as InitialWord).word;
        this.DOM.itemDisplay.textContent = displayForm;
        this.DOM.itemDisplay.setAttribute('aria-label', `Quiz item: ${displayForm}`);
        if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'inline-flex';


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
        if (this.isMuted) return;
        if (!this.speechSynthesisSupported || !this.speechSynthesisUtterance) {
            return;
        }
        if (!this.speechSynthesisReady) {
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

        let selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN' && voice.localService);
        if (!selectedVoice) selectedVoice = this.voices.find(voice => voice.lang === 'ml-IN');
        if (!selectedVoice) selectedVoice = this.voices.find(voice => voice.lang.startsWith('ml-') && voice.localService);
        if (!selectedVoice) selectedVoice = this.voices.find(voice => voice.lang.startsWith('ml-'));

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onerror = (event) => {
            console.error('Speech synthesis error (UI feedback):', event.error, event);
        };

        window.speechSynthesis.speak(utterance);
    },

    async speakItem(item: QuizItem, _emphatic: boolean = false, bypassMute: boolean = false) {
        if (this.isMuted && !bypassMute) return;
        if (!item) return;

        if (this.currentAudioElement) {
            this.currentAudioElement.pause();
            this.currentAudioElement.removeAttribute('src');
            this.currentAudioElement.load();
            this.currentAudioElement = null;
        }
        if (this.speechSynthesisSupported && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }


        const audioType = item.character ? 'letters' : 'words';
        const audioPath = `/audio/${audioType}/${item.id}.mp3`; // Use absolute path

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
                if (this.currentAudioElement === audioElement) {
                    this.currentAudioElement = null;
                }
            };

            audioElement.oncanplaythrough = () => {
                cleanup();
                resolve();
            };
            audioElement.onerror = (e) => {
                cleanup();
                reject(new Error(`Audio not found or error for ${item.id}`));
            };
            audioElement.onended = cleanup;
            audioElement.onabort = cleanup;

            loadTimeoutId = window.setTimeout(() => {
                loadTimeoutId = null;
                cleanup();
                reject(new Error(`Audio load timeout for ${item.id}`));
            }, timeoutDuration);

            audioElement.src = audioPath;
            audioElement.load();
        });

        try {
            await playPromise;
            audioElement.play().catch(playError => {
                console.error(`Error playing custom audio for item ID ${item.id}:`, playError);
                if (this.currentAudioElement === audioElement) {
                    this.currentAudioElement = null;
                }
            });
        } catch (error) {
            if (this.currentAudioElement === audioElement) {
                this.currentAudioElement = null;
            }
        }
    },

    updateFeedback(message: string, type: 'info' | 'error' | 'success' | 'correct' | 'incorrect') {
        this.DOM.feedbackArea.textContent = message;
        this.DOM.feedbackArea.className = `feedback ${type}`;
    },

    updateProgressDisplay() {
        const currentModeStats = this.sessionStats[this.quizMode];
        this.DOM.scoreDisplay.textContent = currentModeStats.score.toString();
        this.DOM.correctStreakDisplay.textContent = currentModeStats.streak.toString();

        const totalItems = this.quizItems.length;
        const reviewedItemsCount = this.quizItems.filter(item => item.reviewed).length;

        this.DOM.reviewedCountDisplay.textContent = reviewedItemsCount.toString();
        this.DOM.totalItemsCountDisplay.textContent = totalItems.toString();

        const currentScore = currentModeStats.score;
        const percentage = totalItems > 0 ? (currentScore / totalItems) * 100 : 0;

        this.DOM.quizProgressBar.style.width = `${Math.min(100, percentage)}%`;
        this.DOM.quizProgressBarContainer.setAttribute('aria-valuenow', Math.min(100, percentage).toFixed(0));

        this.DOM.progressBarLabelText.textContent = 'Surprise Loading...';
        this.DOM.quizProgressBarContainer.setAttribute('aria-label', 'Content loading progress');


        this.DOM.reviewedCountLabel.textContent = this.quizMode === 'letters' ? 'Letters Reviewed' : 'Words Reviewed';
        this.DOM.totalItemsLabel.textContent = this.quizMode === 'letters' ? 'Total Letters' : 'Total Words';
    }

};

export type AppType = typeof App; // Export AppType for use in other modules

document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});
