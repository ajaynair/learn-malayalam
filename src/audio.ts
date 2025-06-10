
import type { AppType, QuizItem } from '../index.tsx';

export function initializeSpeechSynthesisHandler(app: AppType) {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        app.speechSynthesisSupported = true;
        app.speechSynthesisUtterance = new SpeechSynthesisUtterance();

        const loadVoices = () => {
            if (app.voiceLoadTimeoutId !== null) {
                clearTimeout(app.voiceLoadTimeoutId);
                app.voiceLoadTimeoutId = null;
            }
            app.voices = window.speechSynthesis.getVoices();
            if (app.voices.length > 0) {
                app.speechSynthesisReady = true;
            }
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial attempt to load voices

        // Fallback timeout if voiceschanged event doesn't fire or is delayed
        app.voiceLoadTimeoutId = window.setTimeout(() => {
            app.voiceLoadTimeoutId = null; // Clear the timeout ID
            if (!app.speechSynthesisReady && app.voices.length === 0) {
                loadVoices(); // Try one more time
                if (!app.speechSynthesisReady && app.voices.length === 0) {
                    console.error("Speech synthesis voices still not available after timeout.");
                }
            }
        }, 2000); // 2 seconds timeout

    } else {
        console.warn('Speech synthesis not supported by this browser.');
        app.speechSynthesisSupported = false;
    }
}

export async function speakItemHandler(app: AppType, item: QuizItem, _emphatic: boolean = false, bypassMute: boolean = false) {
    if (app.isMuted && !bypassMute) return;
    if (!item) return;

    // Stop any currently playing audio or speech
    if (app.currentAudioElement) {
        app.currentAudioElement.pause();
        app.currentAudioElement.removeAttribute('src'); // Detach source
        app.currentAudioElement.load(); // Reset element
        app.currentAudioElement = null;
    }
    if (app.speechSynthesisSupported && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    // Determine audio path (assuming mp3 files exist in /public/audio/)
    const audioType = item.character ? 'letters' : 'words'; // 'character' field for letters, 'word' for words
    const audioPath = `/audio/${audioType}/${item.id}.mp3`;

    const audioElement = new Audio();
    app.currentAudioElement = audioElement; // Store reference

    const playPromise = new Promise<void>((resolve, reject) => {
        const timeoutDuration = 5000; // 5 seconds for audio to load
        let loadTimeoutId: number | null = null;

        const cleanup = () => {
            if (loadTimeoutId !== null) clearTimeout(loadTimeoutId);
            audioElement.oncanplaythrough = null;
            audioElement.onerror = null;
            audioElement.onended = null;
            audioElement.onabort = null;
            if (app.currentAudioElement === audioElement) { // only nullify if it's still the current one
                app.currentAudioElement = null;
            }
        };

        audioElement.oncanplaythrough = () => {
            cleanup();
            resolve();
        };
        audioElement.onerror = (e) => {
            cleanup();
            console.error(`Audio error for ${item.id} at ${audioPath}:`, e);
            reject(new Error(`Audio not found or error for ${item.id}`));
        };
        audioElement.onended = cleanup; // Cleanup when audio finishes
        audioElement.onabort = cleanup; // Cleanup if loading is aborted

        // Timeout for audio loading
        loadTimeoutId = window.setTimeout(() => {
            loadTimeoutId = null;
            cleanup();
            reject(new Error(`Audio load timeout for ${item.id}`));
        }, timeoutDuration);

        audioElement.src = audioPath;
        audioElement.load(); // Start loading the audio
    });

    try {
        await playPromise;
        // Check mute status again before playing, in case it changed during load
        if (app.isMuted && !bypassMute) {
            if (app.currentAudioElement === audioElement) app.currentAudioElement = null;
            return;
        }
        audioElement.play().catch(playError => {
            console.error(`Error playing custom audio for item ID ${item.id}:`, playError);
            if (app.currentAudioElement === audioElement) app.currentAudioElement = null;
            // Fallback to speech synthesis if custom audio fails to play
            // speakWithSynthesis(app, item, _emphatic);
        });
    } catch (error) {
        console.warn(`Failed to load/play custom audio for ${item.id}: ${(error as Error).message}.`);
        if (app.currentAudioElement === audioElement) app.currentAudioElement = null;
        // Fallback to speech synthesis if custom audio fails
        // speakWithSynthesis(app, item, _emphatic);
    }
}

// Optional: Helper for speech synthesis fallback (not currently used by speakItemHandler above but could be)
/*
function speakWithSynthesis(app: AppType, item: QuizItem, emphatic: boolean) {
    if (!app.speechSynthesisSupported || !app.speechSynthesisUtterance || !app.speechSynthesisReady) {
        console.warn("Speech synthesis not ready or supported, cannot speak item:", item.transliteration);
        return;
    }

    let textToSpeak = item.transliteration; // Default to transliteration
    if (item.character) textToSpeak = item.character; // For letters, speak the character
    else if (item.word) textToSpeak = item.word; // For words, speak the word

    app.speechSynthesisUtterance.text = textToSpeak;

    // Attempt to find a Malayalam voice
    const malayalamVoice = app.voices.find(voice => voice.lang.startsWith('ml'));
    if (malayalamVoice) {
        app.speechSynthesisUtterance.voice = malayalamVoice;
    } else {
        // Optional: select a default/English voice or log that no specific voice was found
        const defaultVoice = app.voices.find(voice => voice.default) || app.voices[0];
        if (defaultVoice) app.speechSynthesisUtterance.voice = defaultVoice;
    }

    // Adjust pitch for emphasis (example)
    app.speechSynthesisUtterance.pitch = emphatic ? 1.5 : 1;
    app.speechSynthesisUtterance.rate = emphatic ? 0.8 : 1;

    window.speechSynthesis.speak(app.speechSynthesisUtterance);
}
*/
