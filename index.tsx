
import './src/style.css'; // Import the external CSS file
import { SHARE_DETAILS_KEYS, SHARE_URL, LOCAL_STORAGE_KEYS } from './constants.ts'; // Updated import
import {
    closeHallOfFameModal,
    checkCompletionAndCelebrate,
    setupHallOfFameEventListeners
} from './src/hallOfFame.ts';
import {
    loadQuizData,
    saveQuizData,
    loadQuizModeFromStorage,
    saveQuizModeToStorage,
    loadSessionStatsFromStorage,
    saveSessionStatsToStorage,
    loadCelebratedModesFromStorage,
    saveCelebratedModesToStorage // Added for use in reset
} from './src/quizDataHandler.ts';
import { initializeMuteControls } from './src/mute.ts';
import { initializeSpeechSynthesisHandler, speakItemHandler } from './src/audio.ts';

export interface InitialLetter {
    id: string;
    character: string;
    displayCharacterOverride?: string;
    category: 'vowel' | 'consonant' | 'chillu' | 'kootaksharam' | 'matra';
    transliteration: string;
}

export interface InitialWord {
    id:string;
    word: string;
    transliteration: string;
}

export type QuizItem = (InitialLetter | InitialWord) & {
    lastReviewedTimestamp: number;
    nextReviewTimestamp: number;
    intervalDays: number;
    easeFactor: number;
    correctStreak: number;
    totalCorrect: number;
    totalIncorrect: number;
    reviewed: boolean;
    character?: string;
    word?: string;
};

export type QuizMode = 'letters' | 'words';

export interface SessionModeStats {
    score: number;
    streak: number;
}

export interface CelebratedModes {
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
    translations: {} as Record<string, any>, // To store loaded translations

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
        totalScoreLabel: document.querySelector('#score-display-wrapper span') as HTMLSpanElement,
        currentStreakLabel: document.querySelector('#streak-display-wrapper span') as HTMLSpanElement,
        reviewedCountLabelStatic: document.querySelector('#reviewed-count-wrapper span') as HTMLSpanElement,
        totalItemsLabelStatic: document.querySelector('#total-items-wrapper span') as HTMLSpanElement,

        lettersModeBtn: document.getElementById('letters-mode-btn') as HTMLButtonElement,
        wordsModeBtn: document.getElementById('words-mode-btn') as HTMLButtonElement,

        headerMainTitle: document.querySelector('header h1') as HTMLHeadingElement,
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
        shareModalTitle: document.getElementById('share-modal-title') as HTMLHeadingElement,
        shareModalDescription: document.querySelector('#share-modal .share-modal-content > p:nth-of-type(1)') as HTMLParagraphElement,
        shareModalOrShareText: document.querySelector('#share-modal .share-modal-content > p:nth-of-type(2)') as HTMLParagraphElement,

        aboutMeModal: document.getElementById('about-me-modal') as HTMLDivElement,
        aboutMeModalCloseBtn: document.getElementById('about-me-modal-close-btn') as HTMLButtonElement,
        aboutMeModalTitle: document.getElementById('about-me-modal-title') as HTMLHeadingElement,
        aboutMeModalGreeting: document.querySelector('#about-me-modal .share-modal-content h3:nth-of-type(2)') as HTMLHeadingElement,
        aboutMeModalPara1: document.querySelector('#about-me-modal .share-modal-content p:nth-of-type(1)') as HTMLParagraphElement,
        aboutMeModalPara2: document.querySelector('#about-me-modal .share-modal-content p:nth-of-type(2)') as HTMLParagraphElement,
        aboutMeModalPara3: document.querySelector('#about-me-modal .share-modal-content p:nth-of-type(3)') as HTMLParagraphElement,
        aboutMeModalPara4: document.querySelector('#about-me-modal .share-modal-content p:nth-of-type(4)') as HTMLParagraphElement,

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
        hofModalCongratsMessage: document.querySelector('#hall-of-fame-modal .share-modal-content > p:nth-of-type(1)') as HTMLParagraphElement,
        hofModalInvitationMessage: document.querySelector('#hall-of-fame-modal .share-modal-content > p:nth-of-type(2)') as HTMLParagraphElement,
        hofModalPromptTitle: document.querySelector('#hall-of-fame-modal .share-modal-content > p:nth-of-type(3)') as HTMLParagraphElement,
        hofModalPromptItem1: document.querySelector('#hall-of-fame-modal .share-modal-content ul li:nth-of-type(1)') as HTMLLIElement,
        hofModalPromptItem2: document.querySelector('#hall-of-fame-modal .share-modal-content ul li:nth-of-type(2)') as HTMLLIElement,
        hofModalPromptItem3: document.querySelector('#hall-of-fame-modal .share-modal-content ul li:nth-of-type(3)') as HTMLLIElement,
        hofModalInspirationMessage: document.querySelector('#hall-of-fame-modal .share-modal-content > p:nth-of-type(4)') as HTMLParagraphElement,
        hofNameLabel: document.querySelector('label[for="hall-of-fame-name-input"]') as HTMLLabelElement,
        hofEmailLabel: document.querySelector('label[for="hall-of-fame-email-input"]') as HTMLLabelElement,
        hofTestimonialLabel: document.querySelector('label[for="hall-of-fame-testimonial-input"]') as HTMLLabelElement,

        nextStepsTitle: document.querySelector('.next-steps-card h3') as HTMLHeadingElement,
        nextStepsIntro: document.querySelector('.next-steps-card > p:nth-of-type(1)') as HTMLParagraphElement,
        nextStepsWhyWorksTitle: document.querySelector('.next-steps-card h4:nth-of-type(1)') as HTMLHeadingElement,
        nextStepsWhyWorksPara1: document.querySelector('.next-steps-card > p:nth-of-type(2)') as HTMLParagraphElement,
        nextStepsWhyWorksPara2: document.querySelector('.next-steps-card > p:nth-of-type(3)') as HTMLParagraphElement,
        nextStepsWhyWorksPara3: document.querySelector('.next-steps-card > p:nth-of-type(4)') as HTMLParagraphElement,
        nextStepsHowToTitle: document.querySelector('.next-steps-card h4:nth-of-type(2)') as HTMLHeadingElement,
        nextStepsListItemDaily: document.querySelector('.next-steps-card ul li:nth-of-type(1)') as HTMLLIElement,
        nextStepsListItemListen: document.querySelector('.next-steps-card ul li:nth-of-type(2)') as HTMLLIElement,
        nextStepsListItemSpeak: document.querySelector('.next-steps-card ul li:nth-of-type(3)') as HTMLLIElement,
        nextStepsListItemExplore: document.querySelector('.next-steps-card ul li:nth-of-type(4)') as HTMLLIElement,
        nextStepsListItemSwitch: document.querySelector('.next-steps-card ul li:nth-of-type(5)') as HTMLLIElement,
        nextStepsEncouragement: document.querySelector('.next-steps-card p.encouragement') as HTMLParagraphElement,

        hofSectionTitle: document.querySelector('.hall-of-fame-card h2') as HTMLHeadingElement,
        hofEntryAravindanName: document.getElementById('hofEntryAravindanName') as HTMLHeadingElement,
        hofEntryAravindanQuote: document.getElementById('hofEntryAravindanQuote') as HTMLParagraphElement,
        hofEntryAmanaName: document.getElementById('hofEntryAmanaName') as HTMLHeadingElement,
        hofEntryAmanaQuote: document.getElementById('hofEntryAmanaQuote') as HTMLParagraphElement,

        supportMeTitle: document.querySelector('.support-me-card h3') as HTMLHeadingElement,
        supportMeDescription: document.querySelector('.support-me-card > p:nth-of-type(1)') as HTMLParagraphElement,
        supportMeButton: document.querySelector('.support-me-card .buy-coffee-btn') as HTMLAnchorElement,
        supportMeThanksNote: document.querySelector('.support-me-card p.thanks-note') as HTMLParagraphElement,

        footerCopyright: document.querySelector('footer p') as HTMLParagraphElement,

        // Reset Progress Elements
        resetProgressBtn: document.getElementById('reset-progress-btn') as HTMLButtonElement,
        resetConfirmationModal: document.getElementById('reset-confirmation-modal') as HTMLDivElement,
        resetConfirmationModalTitle: document.getElementById('reset-confirmation-modal-title') as HTMLHeadingElement,
        resetConfirmationModalMessage: document.getElementById('reset-confirmation-modal-message') as HTMLParagraphElement,
        resetConfirmationModalCloseBtn: document.getElementById('reset-confirmation-modal-close-btn') as HTMLButtonElement,
        resetConfirmBtn: document.getElementById('reset-confirm-btn') as HTMLButtonElement,
        resetCancelBtn: document.getElementById('reset-cancel-btn') as HTMLButtonElement,
    },

    async init() {
        try {
            const response = await fetch('/english.json');
            if (!response.ok) {
                throw new Error(`Failed to load translations: ${response.statusText} (Status: ${response.status})`);
            }
            this.translations = await response.json();
        } catch (error) {
            console.error("CRITICAL ERROR: Error loading translations from /english.json.", error);
            if (this.DOM.feedbackArea) {
                this.DOM.feedbackArea.textContent = `CRITICAL: Text content failed to load. Try refreshing. (${(error as Error).message})`;
                this.DOM.feedbackArea.className = 'feedback error';
                this.DOM.feedbackArea.style.fontWeight = 'bold';
                this.DOM.feedbackArea.style.border = '2px solid red';
                this.DOM.feedbackArea.style.padding = '10px';
            } else {
                alert(`CRITICAL: Text content failed to load. Try refreshing. (${(error as Error).message})`);
            }
        }

        this.populateStaticTexts();

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

        if(this.DOM.replayItemAudioBtn) {
            this.DOM.replayItemAudioBtn.addEventListener('click', () => {
                if (this.currentItem) {
                    speakItemHandler(this, this.currentItem, false, true);
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

        setupHallOfFameEventListeners(this, this.DOM);

        // Reset Progress Event Listeners
        if (this.DOM.resetProgressBtn) {
            this.DOM.resetProgressBtn.addEventListener('click', () => this.openResetConfirmationModal());
        }
        if (this.DOM.resetConfirmBtn) {
            this.DOM.resetConfirmBtn.addEventListener('click', () => this.handleResetProgressConfirmed());
        }
        if (this.DOM.resetCancelBtn) {
            this.DOM.resetCancelBtn.addEventListener('click', () => this.closeResetConfirmationModal());
        }
        if (this.DOM.resetConfirmationModalCloseBtn) {
            this.DOM.resetConfirmationModalCloseBtn.addEventListener('click', () => this.closeResetConfirmationModal());
        }


        initializeSpeechSynthesisHandler(this);
        initializeMuteControls(this, this.DOM);
        loadQuizModeFromStorage(this);
        loadSessionStatsFromStorage(this);
        loadCelebratedModesFromStorage(this);
        this.updateModeButtonStyles();
        await loadQuizData(this);
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
                    closeHallOfFameModal(this.DOM, this);
                }
                if (this.DOM.resetConfirmationModal.style.display === 'flex') {
                    this.closeResetConfirmationModal();
                }
            }
        });
    },

    getText(key: string, replacements?: Record<string, string>): string {
        if (Object.keys(this.translations).length === 0) {
            const errorKey = key.replace(/\./g, '_').toUpperCase();
            console.warn(`Translations not loaded. Returning error placeholder for key: ${key}`);
            return `[ERR_NO_TRANSLATIONS_FOR_${errorKey}]`;
        }

        const keys = key.split('.');
        let value: any = this.translations;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}. Path failed at '${k}'.`);
                return `[ERR_KEY_NOT_FOUND_${key.replace(/\./g, '_').toUpperCase()}]`;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`Translation value for key '${key}' is not a string:`, value);
            return `[ERR_VALUE_NOT_STRING_${key.replace(/\./g, '_').toUpperCase()}]`;
        }

        let result = value as string;
        if (replacements) {
            for (const placeholder in replacements) {
                result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacements[placeholder]);
            }
        }
        return result;
    },

    populateStaticTexts() {
        document.title = this.getText('meta.title');
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', this.getText('meta.description'));
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) metaKeywords.setAttribute('content', this.getText('meta.keywords'));

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', document.title);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && metaDesc) ogDesc.setAttribute('content', metaDesc.getAttribute('content') || '');

        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) twitterTitle.setAttribute('content', document.title);
        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc && metaDesc) twitterDesc.setAttribute('content', metaDesc.getAttribute('content') || '');

        if (this.DOM.headerMainTitle) this.DOM.headerMainTitle.innerHTML = this.getText('header.mainTitle');
        if (this.DOM.headerAboutBtn) {
            this.DOM.headerAboutBtn.textContent = this.getText('header.aboutButton');
            this.DOM.headerAboutBtn.setAttribute('aria-label', this.getText('header.aboutButtonAriaLabel'));
            this.DOM.headerAboutBtn.title = this.getText('header.aboutButtonAriaLabel');
        }
        if (this.DOM.headerShareBtn) {
            this.DOM.headerShareBtn.textContent = this.getText('header.shareButton');
            this.DOM.headerShareBtn.setAttribute('aria-label', this.getText('header.shareButtonAriaLabel'));
            this.DOM.headerShareBtn.title = this.getText('header.shareButtonAriaLabel');
        }
        if (this.DOM.headerCoffeeBtn) {
            this.DOM.headerCoffeeBtn.setAttribute('aria-label', this.getText('header.coffeeButtonAriaLabel'));
            this.DOM.headerCoffeeBtn.title = this.getText('header.coffeeButtonAriaLabel');
        }

        if (this.DOM.lettersModeBtn) this.DOM.lettersModeBtn.textContent = this.getText('modeSwitcher.lettersButton');
        if (this.DOM.wordsModeBtn) this.DOM.wordsModeBtn.textContent = this.getText('modeSwitcher.wordsButton');

        if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.setAttribute('aria-label', this.getText('quiz.replayAudioButtonAriaLabel'));
        if (this.DOM.nextQuestionBtn) this.DOM.nextQuestionBtn.textContent = this.getText('quiz.nextQuestionButton');

        const totalScoreWrapper = this.DOM.scoreDisplay.parentElement;
        if (totalScoreWrapper) (totalScoreWrapper.querySelector('span:first-child') as HTMLElement).textContent = this.getText('progressDisplay.totalScoreLabel');
        const streakWrapper = this.DOM.correctStreakDisplay.parentElement;
        if (streakWrapper) (streakWrapper.querySelector('span:first-child') as HTMLElement).textContent = this.getText('progressDisplay.currentStreakLabel');
        const reviewedWrapper = this.DOM.reviewedCountDisplay.parentElement;
        if (reviewedWrapper) (reviewedWrapper.querySelector('span:first-child') as HTMLElement).textContent = this.getText('progressDisplay.itemsReviewedLabel');
        const totalItemsWrapper = this.DOM.totalItemsCountDisplay.parentElement;
        if (totalItemsWrapper) (totalItemsWrapper.querySelector('span:first-child') as HTMLElement).textContent = this.getText('progressDisplay.totalItemsLabel');

        if (this.DOM.shareModalTitle) this.DOM.shareModalTitle.textContent = this.getText('shareModal.title');
        if (this.DOM.shareModalCloseBtn) {
            this.DOM.shareModalCloseBtn.textContent = '×';
            this.DOM.shareModalCloseBtn.setAttribute('aria-label', this.getText('shareModal.closeButtonAriaLabel'));
        }
        if (this.DOM.shareModalDescription) this.DOM.shareModalDescription.innerHTML = this.getText('shareModal.description');
        if (this.DOM.copyUrlBtn) this.DOM.copyUrlBtn.textContent = this.getText('shareModal.copyUrlButton');
        if (this.DOM.shareModalOrShareText) this.DOM.shareModalOrShareText.innerHTML = this.getText('shareModal.shareOnText');
        if (this.DOM.shareTwitter) this.DOM.shareTwitter.textContent = this.getText('shareModal.twitterButton');
        if (this.DOM.shareFacebook) this.DOM.shareFacebook.textContent = this.getText('shareModal.facebookButton');
        if (this.DOM.shareWhatsApp) this.DOM.shareWhatsApp.textContent = this.getText('shareModal.whatsappButton');
        if (this.DOM.shareLinkedIn) this.DOM.shareLinkedIn.textContent = this.getText('shareModal.linkedinButton');
        if (this.DOM.shareEmail) this.DOM.shareEmail.textContent = this.getText('shareModal.emailButton');
        if (this.DOM.shareUrlInput) this.DOM.shareUrlInput.setAttribute('aria-label', this.getText('shareModal.shareUrlInputAriaLabel'));

        if (this.DOM.aboutMeModalTitle) this.DOM.aboutMeModalTitle.textContent = this.getText('aboutMeModal.title');
        if (this.DOM.aboutMeModalCloseBtn) {
            this.DOM.aboutMeModalCloseBtn.textContent = '×';
            this.DOM.aboutMeModalCloseBtn.setAttribute('aria-label', this.getText('aboutMeModal.closeButtonAriaLabel'));
        }
        if (this.DOM.aboutMeModalGreeting) this.DOM.aboutMeModalGreeting.innerHTML = this.getText('aboutMeModal.greeting');
        if (this.DOM.aboutMeModalPara1) this.DOM.aboutMeModalPara1.innerHTML = this.getText('aboutMeModal.para1');
        if (this.DOM.aboutMeModalPara2) this.DOM.aboutMeModalPara2.innerHTML = this.getText('aboutMeModal.para2');
        if (this.DOM.aboutMeModalPara3) this.DOM.aboutMeModalPara3.innerHTML = this.getText('aboutMeModal.para3');
        if (this.DOM.aboutMeModalPara4) this.DOM.aboutMeModalPara4.innerHTML = this.getText('aboutMeModal.para4');

        if (this.DOM.hallOfFameModalCloseBtn) {
            this.DOM.hallOfFameModalCloseBtn.textContent = '×';
            this.DOM.hallOfFameModalCloseBtn.setAttribute('aria-label', this.getText('hallOfFameModal.closeButtonAriaLabel'));
        }
        if (this.DOM.hofModalInvitationMessage) this.DOM.hofModalInvitationMessage.innerHTML = this.getText('hallOfFameModal.invitationMessage');
        if (this.DOM.hofModalPromptTitle) this.DOM.hofModalPromptTitle.innerHTML = this.getText('hallOfFameModal.promptTitle');
        if (this.DOM.hofModalPromptItem1) this.DOM.hofModalPromptItem1.innerHTML = this.getText('hallOfFameModal.promptItem1');
        if (this.DOM.hofModalPromptItem2) this.DOM.hofModalPromptItem2.innerHTML = this.getText('hallOfFameModal.promptItem2');
        if (this.DOM.hofModalPromptItem3) this.DOM.hofModalPromptItem3.innerHTML = this.getText('hallOfFameModal.promptItem3');
        if (this.DOM.hofModalInspirationMessage) this.DOM.hofModalInspirationMessage.innerHTML = this.getText('hallOfFameModal.inspirationMessage');
        if (this.DOM.hofNameLabel) this.DOM.hofNameLabel.textContent = this.getText('hallOfFameModal.form.nameLabel');
        if (this.DOM.hallOfFameNameInput) this.DOM.hallOfFameNameInput.placeholder = this.getText('hallOfFameModal.form.namePlaceholder');
        if (this.DOM.hofEmailLabel) this.DOM.hofEmailLabel.textContent = this.getText('hallOfFameModal.form.emailLabel');
        if (this.DOM.hallOfFameEmailInput) this.DOM.hallOfFameEmailInput.placeholder = this.getText('hallOfFameModal.form.emailPlaceholder');
        if (this.DOM.hofTestimonialLabel) this.DOM.hofTestimonialLabel.textContent = this.getText('hallOfFameModal.form.testimonialLabel');
        if (this.DOM.hallOfFameTestimonialInput) {
            this.DOM.hallOfFameTestimonialInput.placeholder = this.getText('hallOfFameModal.form.testimonialPlaceholder');
            this.DOM.hallOfFameTestimonialInput.setAttribute('aria-label', this.getText('hallOfFameModal.form.testimonialAriaLabel'));
        }
        if (this.DOM.submitTestimonialBtn) this.DOM.submitTestimonialBtn.textContent = this.getText('hallOfFameModal.form.submitButton');

        if(this.DOM.nextStepsTitle) this.DOM.nextStepsTitle.innerHTML = this.getText('nextSteps.title');
        if(this.DOM.nextStepsIntro) this.DOM.nextStepsIntro.innerHTML = this.getText('nextSteps.intro');
        if(this.DOM.nextStepsWhyWorksTitle) this.DOM.nextStepsWhyWorksTitle.innerHTML = this.getText('nextSteps.whyWorksTitle');
        if(this.DOM.nextStepsWhyWorksPara1) this.DOM.nextStepsWhyWorksPara1.innerHTML = this.getText('nextSteps.whyWorksPara1');
        if(this.DOM.nextStepsWhyWorksPara2) this.DOM.nextStepsWhyWorksPara2.innerHTML = this.getText('nextSteps.whyWorksPara2');

        const whyWorksPara3Text = this.getText('nextSteps.whyWorksPara3Start') +
            ` <span class="bookmark-tip" role="tooltip" title="${this.getText('nextSteps.whyWorksPara3BookmarkTip')}">${this.getText('nextSteps.whyWorksPara3Bookmark')}</span> ` +
            this.getText('nextSteps.whyWorksPara3End');
        if(this.DOM.nextStepsWhyWorksPara3) this.DOM.nextStepsWhyWorksPara3.innerHTML = whyWorksPara3Text;

        if(this.DOM.nextStepsHowToTitle) this.DOM.nextStepsHowToTitle.innerHTML = this.getText('nextSteps.howToTitle');
        if(this.DOM.nextStepsListItemDaily) this.DOM.nextStepsListItemDaily.innerHTML = this.getText('nextSteps.listItemDailyDose');
        if(this.DOM.nextStepsListItemListen) this.DOM.nextStepsListItemListen.innerHTML = this.getText('nextSteps.listItemListenUp');
        if(this.DOM.nextStepsListItemSpeak) this.DOM.nextStepsListItemSpeak.innerHTML = this.getText('nextSteps.listItemSpeakOut');
        if(this.DOM.nextStepsListItemExplore) this.DOM.nextStepsListItemExplore.innerHTML = this.getText('nextSteps.listItemExploreMore');
        if(this.DOM.nextStepsListItemSwitch) this.DOM.nextStepsListItemSwitch.innerHTML = this.getText('nextSteps.listItemSwitchSolidify');
        if(this.DOM.nextStepsEncouragement) this.DOM.nextStepsEncouragement.innerHTML = this.getText('nextSteps.encouragement');

        if(this.DOM.hofSectionTitle) this.DOM.hofSectionTitle.innerHTML = this.getText('hallOfFameSection.title');
        if(this.DOM.hofEntryAravindanName) this.DOM.hofEntryAravindanName.innerHTML = this.getText('hallOfFameSection.aravindanName');
        if(this.DOM.hofEntryAravindanQuote) this.DOM.hofEntryAravindanQuote.innerHTML = this.getText('hallOfFameSection.aravindanQuote');
        if(this.DOM.hofEntryAmanaName) this.DOM.hofEntryAmanaName.innerHTML = this.getText('hallOfFameSection.amanaName');
        if(this.DOM.hofEntryAmanaQuote) this.DOM.hofEntryAmanaQuote.innerHTML = this.getText('hallOfFameSection.amanaQuote');

        if(this.DOM.supportMeTitle) this.DOM.supportMeTitle.innerHTML = this.getText('supportMe.title');
        if(this.DOM.supportMeDescription) this.DOM.supportMeDescription.innerHTML = this.getText('supportMe.description');
        if(this.DOM.supportMeButton) this.DOM.supportMeButton.innerHTML = this.getText('supportMe.buttonText');
        if(this.DOM.supportMeThanksNote) this.DOM.supportMeThanksNote.innerHTML = this.getText('supportMe.thanksNote');

        if(this.DOM.testHofBtn) this.DOM.testHofBtn.textContent = this.getText('testControls.testHofButton');

        // Settings Card & Reset Modal (Reset button text is set here)
        if (this.DOM.resetProgressBtn) {
            this.DOM.resetProgressBtn.textContent = this.getText('settingsCard.resetButton');
            this.DOM.resetProgressBtn.setAttribute('aria-label', this.getText('settingsCard.resetButtonAriaLabel'));
        }
        if (this.DOM.resetConfirmationModalTitle) this.DOM.resetConfirmationModalTitle.textContent = this.getText('resetConfirmationModal.title');
        if (this.DOM.resetConfirmationModalMessage) this.DOM.resetConfirmationModalMessage.textContent = this.getText('resetConfirmationModal.message');
        if (this.DOM.resetConfirmBtn) this.DOM.resetConfirmBtn.textContent = this.getText('resetConfirmationModal.confirmButton');
        if (this.DOM.resetCancelBtn) this.DOM.resetCancelBtn.textContent = this.getText('resetConfirmationModal.cancelButton');
        if (this.DOM.resetConfirmationModalCloseBtn) {
            this.DOM.resetConfirmationModalCloseBtn.textContent = '×';
            this.DOM.resetConfirmationModalCloseBtn.setAttribute('aria-label', this.getText('resetConfirmationModal.closeButtonAriaLabel'));
        }

        if(this.DOM.footerCopyright) this.DOM.footerCopyright.innerHTML = this.getText('footer.copyright', { year: new Date().getFullYear().toString() });

        if (Object.keys(this.translations).length > 0) {
            this.updateFeedback('quiz.initialFeedback', 'info');
        }
    },


    scrollToSupportSection() {
        const supportSection = document.querySelector('.support-me-card');
        if (supportSection) {
            supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    async handleShare() {
        const shareTitle = this.getText(SHARE_DETAILS_KEYS.titleKey);
        const shareText = this.getText(SHARE_DETAILS_KEYS.textKey);

        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: shareText, url: SHARE_URL });
                this.updateFeedback('feedbackMessages.linkShared', 'success');
            } catch (error: unknown) {
                console.error('Error sharing via Web Share API:', error);
                if (error instanceof DOMException && error.name === 'AbortError') {
                    // User aborted share
                } else if (error instanceof Error) {
                    this.updateFeedback('feedbackMessages.shareError', 'error', { errorMessage: error.message });
                    this.openShareModal();
                } else {
                    this.updateFeedback('feedbackMessages.shareErrorUnknown', 'error');
                    this.openShareModal();
                }
            }
        } else {
            this.openShareModal();
        }
    },

    openShareModal() {
        this.DOM.shareUrlInput.value = SHARE_URL;
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

    openResetConfirmationModal() {
        this.DOM.resetConfirmationModal.style.display = 'flex';
        this.DOM.resetConfirmationModal.setAttribute('aria-hidden', 'false');
        this.DOM.resetProgressBtn.setAttribute('aria-expanded', 'true');
        this.DOM.resetConfirmBtn.focus();
    },

    closeResetConfirmationModal() {
        this.DOM.resetConfirmationModal.style.display = 'none';
        this.DOM.resetConfirmationModal.setAttribute('aria-hidden', 'true');
        this.DOM.resetProgressBtn.setAttribute('aria-expanded', 'false');
        this.DOM.resetProgressBtn.focus();
    },

    async handleResetProgressConfirmed() {
        console.log("Resetting progress...");

        // Clear item progress for both modes
        localStorage.removeItem(LOCAL_STORAGE_KEYS.letters);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.words);

        // Reset and save session stats
        this.sessionStats = {
            letters: { score: 0, streak: 0 },
            words: { score: 0, streak: 0 },
        };
        saveSessionStatsToStorage(this);

        // Reset and save celebrated modes
        this.celebratedModes = {
            letters: false,
            words: false,
        };
        saveCelebratedModesToStorage(this);

        // Mode remains the same, no need to reset LOCAL_STORAGE_KEYS.mode
        // Mute state remains the same, no need to reset LOCAL_STORAGE_KEYS.mute

        await loadQuizData(this); // Reload fresh quiz data
        this.updateProgressDisplay();
        this.nextQuestion();

        this.updateFeedback('feedbackMessages.progressResetSuccess', 'success');
        this.closeResetConfirmationModal();
    },


    async copyShareUrl() {
        try {
            await navigator.clipboard.writeText(this.DOM.shareUrlInput.value);
            this.DOM.copyUrlBtn.textContent = this.getText('shareModal.copiedFeedback');
            this.DOM.copyUrlBtn.disabled = true;
            setTimeout(() => {
                this.DOM.copyUrlBtn.textContent = this.getText('shareModal.copyUrlButton');
                this.DOM.copyUrlBtn.disabled = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy URL: ', err);
            this.updateFeedback('shareModal.copyFailedFeedback', 'error');
        }
    },

    configureSocialShareLinks() {
        const title = encodeURIComponent(this.getText(SHARE_DETAILS_KEYS.titleKey));
        const text = encodeURIComponent(this.getText(SHARE_DETAILS_KEYS.textKey));
        const shortTextForTwitter = encodeURIComponent(this.getText(SHARE_DETAILS_KEYS.titleKey));
        const url = encodeURIComponent(SHARE_URL);

        this.DOM.shareTwitter.href = `https://twitter.com/intent/tweet?text=${shortTextForTwitter}&url=${url}`;
        this.DOM.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        this.DOM.shareWhatsApp.href = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        this.DOM.shareLinkedIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        this.DOM.shareEmail.href = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
    },

    async switchQuizMode(newMode: QuizMode) {
        if (this.quizMode === newMode) return;

        this.quizMode = newMode;
        saveQuizModeToStorage(this);
        this.updateModeButtonStyles();

        await loadQuizData(this);
        this.updateProgressDisplay();
        this.nextQuestion();
        this.updateFeedback('feedbackMessages.switchedMode', 'info', { mode: newMode });
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
        this.DOM.nextQuestionBtn.style.display = 'inline-block';

        const isCorrect = selectedTransliteration === this.currentItem.transliteration;
        const currentModeStats = this.sessionStats[this.quizMode];
        const totalItems = this.quizItems.length;

        if (this.DOM.answerFeedbackIcon) {
            if (isCorrect) {
                this.DOM.answerFeedbackIcon.textContent = '✔';
                this.DOM.answerFeedbackIcon.style.color = '#2e73b8';
                this.DOM.answerFeedbackIcon.setAttribute('aria-label', this.getText('quiz.feedbackIconCorrectAriaLabel'));
            } else {
                this.DOM.answerFeedbackIcon.textContent = '✖';
                this.DOM.answerFeedbackIcon.style.color = '#d9534f';
                this.DOM.answerFeedbackIcon.setAttribute('aria-label', this.getText('quiz.feedbackIconIncorrectAriaLabel'));
            }
            this.DOM.answerFeedbackIcon.style.display = 'inline';
        }

        if (isCorrect) {
            currentModeStats.score++;
            currentModeStats.score = Math.min(currentModeStats.score, totalItems); // Cap score
            currentModeStats.streak++;
            currentModeStats.streak = Math.min(currentModeStats.streak, totalItems); // Cap streak

            this.currentItem.correctStreak++;
            this.currentItem.totalCorrect++;
            speakItemHandler(this, this.currentItem, false, false);
            if (this.currentItem.correctStreak === 1) this.currentItem.intervalDays = 1;
            else if (this.currentItem.correctStreak === 2) this.currentItem.intervalDays = 6;
            else this.currentItem.intervalDays = Math.ceil(this.currentItem.intervalDays * this.currentItem.easeFactor);
            this.currentItem.intervalDays = Math.min(this.currentItem.intervalDays, 365);
            this.currentItem.easeFactor += 0.1;
        } else {
            currentModeStats.streak = 0;
            this.currentItem.correctStreak = 0;
            this.currentItem.totalIncorrect++;
            speakItemHandler(this, this.currentItem, true, false);
            if (navigator.vibrate) navigator.vibrate(200);
            this.currentItem.intervalDays = 1;
            this.currentItem.easeFactor = Math.max(1.3, this.currentItem.easeFactor - 0.2);
        }

        this.currentItem.lastReviewedTimestamp = Date.now();
        this.currentItem.nextReviewTimestamp = Date.now() + (this.currentItem.intervalDays * 24 * 60 * 60 * 1000);
        this.currentItem.reviewed = true;

        saveQuizData(this);
        saveSessionStatsToStorage(this);
        this.updateProgressDisplay();
        checkCompletionAndCelebrate(this);

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
            if (Object.keys(this.translations).length > 0) {
                this.updateFeedback('quiz.initialFeedback', 'info');
            }
            if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'inline-flex';
        } else {
            this.DOM.itemDisplay.textContent = this.getText('quiz.itemDisplayAllLearned');
            if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'none';

            const allReviewed = this.quizItems.length > 0 && this.quizItems.every(item => item.reviewed);
            if (allReviewed && this.quizItems.length > 0 && !this.celebratedModes[this.quizMode]) {
                this.updateFeedback('quiz.feedbackAllLearnedCelebration', 'success');
                checkCompletionAndCelebrate(this);
            } else if (allReviewed && this.quizItems.length > 0) {
                this.updateFeedback('quiz.feedbackAllLearnedDone', 'success');
            } else {
                const feedbackKey = this.quizItems.length > 0 ? 'quiz.feedbackAllLearnedNoNew' : 'quiz.feedbackNoItemsLoaded';
                const feedbackType = this.quizItems.length > 0 ? 'success' : 'error';
                this.updateFeedback(feedbackKey, feedbackType);
            }
            this.DOM.optionsContainer.innerHTML = '';
        }
    },

    renderQuiz() {
        if (!this.currentItem) return;
        const displayForm = this.currentItem.character ? ((this.currentItem as InitialLetter).displayCharacterOverride || (this.currentItem as InitialLetter).character) : (this.currentItem as InitialWord).word;
        this.DOM.itemDisplay.textContent = displayForm;
        this.DOM.itemDisplay.setAttribute('aria-label', this.getText('quiz.itemDisplayAriaLabel', { displayForm }));
        if (this.DOM.replayItemAudioBtn) this.DOM.replayItemAudioBtn.style.display = 'inline-flex';

        this.DOM.optionsContainer.innerHTML = '';
        this.options.forEach(opt => {
            const button = document.createElement('button');
            button.textContent = opt;
            button.setAttribute('aria-label', this.getText('optionButtonAriaLabel', { optionText: opt }));
            button.onclick = () => this.handleOptionClick(opt);
            this.DOM.optionsContainer.appendChild(button);
        });
    },

    updateFeedback(keyOrMessage: string, type: 'info' | 'error' | 'success' | 'correct' | 'incorrect', replacements?: Record<string, string>) {
        const isKey = keyOrMessage.includes('.') || keyOrMessage.startsWith('feedbackMessages.') || keyOrMessage.startsWith('quiz.') || keyOrMessage.startsWith('shareModal.') || keyOrMessage.startsWith('hallOfFameModal.');
        const message = isKey ? this.getText(keyOrMessage, replacements) : keyOrMessage;

        this.DOM.feedbackArea.textContent = message;
        this.DOM.feedbackArea.className = `feedback ${type}`;
        if (!message.startsWith("CRITICAL:")) {
            this.DOM.feedbackArea.style.fontWeight = 'bold';
            this.DOM.feedbackArea.style.border = 'none';
            this.DOM.feedbackArea.style.padding = '0';
        }
    },


    updateProgressDisplay() {
        const currentModeStats = this.sessionStats[this.quizMode];
        const totalItems = this.quizItems.length;

        const cappedScore = Math.min(currentModeStats.score, totalItems);
        const cappedStreak = Math.min(currentModeStats.streak, totalItems);
        const reviewedItemsCount = this.quizItems.filter(item => item.reviewed).length;
        const cappedReviewedItemsCount = Math.min(reviewedItemsCount, totalItems);

        this.DOM.scoreDisplay.textContent = cappedScore.toString();
        this.DOM.correctStreakDisplay.textContent = cappedStreak.toString();
        this.DOM.reviewedCountDisplay.textContent = cappedReviewedItemsCount.toString();
        this.DOM.totalItemsCountDisplay.textContent = totalItems.toString();

        const percentage = totalItems > 0 ? (cappedScore / totalItems) * 100 : 0;

        this.DOM.quizProgressBar.style.width = `${Math.min(100, percentage)}%`;
        this.DOM.quizProgressBarContainer.setAttribute('aria-valuenow', Math.min(100, percentage).toFixed(0));

        this.DOM.progressBarLabelText.textContent = this.getText('progressDisplay.surpriseLoadingText');
        this.DOM.quizProgressBarContainer.setAttribute('aria-label', this.getText('progressDisplay.progressBarAriaLabel'));
    }
};

export type AppType = typeof App;

document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});
