
import type { AppType, QuizItem, InitialLetter, InitialWord, QuizMode, SessionModeStats, CelebratedModes } from '../index.tsx';
import { LOCAL_STORAGE_KEYS } from '../constants.ts';

// --- Quiz Data (Items) ---
export async function loadQuizData(app: AppType) {
    const dataUrl = app.quizMode === 'letters' ? '/lettersData.json' : '/wordsData.json';
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${dataUrl}`);
        }
        const initialItems: (InitialLetter[] | InitialWord[]) = await response.json();

        const storedProgressRaw = localStorage.getItem(LOCAL_STORAGE_KEYS[app.quizMode]);
        let storedProgress: Record<string, Partial<QuizItem>> = {};
        if (storedProgressRaw) {
            try {
                storedProgress = JSON.parse(storedProgressRaw);
            } catch (e) {
                console.error("Failed to parse stored progress, resetting.", e);
                localStorage.removeItem(LOCAL_STORAGE_KEYS[app.quizMode]);
            }
        }

        app.quizItems = initialItems.map(item => ({
            ...app.getDefaultSRDFields(), // Get default SRS fields
            ...item,                     // Spread initial item data (id, character/word, transliteration, category)
            ...(storedProgress[item.id] || {}), // Spread stored progress for this item if any
        }));

        if (app.quizItems.length === 0) {
            app.updateFeedback(`No items loaded for ${app.quizMode}. Check data files.`, 'error');
        }
        app.DOM.totalItemsCountDisplay.textContent = app.quizItems.length.toString();

    } catch (error) {
        console.error(`Failed to load ${app.quizMode} data:`, error);
        app.updateFeedback(`Error loading ${app.quizMode} data. Please try refreshing.`, 'error');
        app.quizItems = [];
        app.DOM.totalItemsCountDisplay.textContent = '0';
    }
    app.updateProgressDisplay();
}

export function saveQuizData(app: AppType) {
    if (!app.quizItems || app.quizItems.length === 0) return;

    const progressToStore: Record<string, Partial<QuizItem>> = {};
    app.quizItems.forEach(item => {
        progressToStore[item.id] = {
            lastReviewedTimestamp: item.lastReviewedTimestamp,
            nextReviewTimestamp: item.nextReviewTimestamp,
            intervalDays: item.intervalDays,
            easeFactor: item.easeFactor,
            correctStreak: item.correctStreak,
            totalCorrect: item.totalCorrect,
            totalIncorrect: item.totalIncorrect,
            reviewed: item.reviewed,
        };
    });
    try {
        localStorage.setItem(LOCAL_STORAGE_KEYS[app.quizMode], JSON.stringify(progressToStore));
    } catch (e) {
        console.error("Failed to save progress to localStorage:", e);
        app.updateFeedback("Could not save progress. Storage might be full.", "error");
    }
}

// --- Quiz Mode ---
export function loadQuizModeFromStorage(app: AppType) {
    const storedMode = localStorage.getItem(LOCAL_STORAGE_KEYS.mode) as QuizMode | null;
    if (storedMode && (storedMode === 'letters' || storedMode === 'words')) {
        app.quizMode = storedMode;
    } else {
        app.quizMode = 'letters'; // Default mode
    }
}

export function saveQuizModeToStorage(app: AppType) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.mode, app.quizMode);
}

// --- Session Stats ---
export function loadSessionStatsFromStorage(app: AppType) {
    const storedStatsRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.sessionStats);
    if (storedStatsRaw) {
        try {
            const storedStats = JSON.parse(storedStatsRaw);
            if (storedStats.letters && storedStats.words) {
                app.sessionStats = storedStats as { letters: SessionModeStats; words: SessionModeStats };
            } else {
                console.warn("Stored session stats format is incorrect. Resetting.");
                resetSessionStats(app);
            }
        } catch (e) {
            console.error("Failed to parse session stats from localStorage. Resetting.", e);
            resetSessionStats(app);
        }
    } else {
        resetSessionStats(app);
    }
}
function resetSessionStats(app: AppType) {
    app.sessionStats = {
        letters: { score: 0, streak: 0 },
        words: { score: 0, streak: 0 },
    };
    saveSessionStatsToStorage(app); // Save the reset stats
}


export function saveSessionStatsToStorage(app: AppType) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.sessionStats, JSON.stringify(app.sessionStats));
}

// --- Mute State ---
export function loadMuteStateFromStorage(app: AppType) {
    const storedMuteState = localStorage.getItem(LOCAL_STORAGE_KEYS.mute);
    app.isMuted = storedMuteState === 'true';
}

export function saveMuteStateToStorage(app: AppType) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.mute, String(app.isMuted));
}

// --- Celebrated Modes ---
export function loadCelebratedModesFromStorage(app: AppType) {
    const storedCelebratedRaw = localStorage.getItem(LOCAL_STORAGE_KEYS.celebratedModes);
    if (storedCelebratedRaw) {
        try {
            const storedCelebrated = JSON.parse(storedCelebratedRaw);
            if (typeof storedCelebrated.letters === 'boolean' && typeof storedCelebrated.words === 'boolean') {
                app.celebratedModes = storedCelebrated as CelebratedModes;
            } else {
                app.celebratedModes = { letters: false, words: false };
            }
        } catch (e) {
            console.error("Failed to parse celebrated modes. Resetting.", e);
            app.celebratedModes = { letters: false, words: false };
        }
    } else {
        app.celebratedModes = { letters: false, words: false };
    }
}

export function saveCelebratedModesToStorage(app: AppType) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.celebratedModes, JSON.stringify(app.celebratedModes));
}
