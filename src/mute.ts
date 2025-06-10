
import type { AppType } from '../index.tsx';
import { loadMuteStateFromStorage, saveMuteStateToStorage } from './quizDataHandler.ts';

/**
 * Updates the mute button's icon, text, ARIA attributes, and CSS class based on the mute state.
 */
export function updateMuteButtonIconAndText(app: AppType, dom: AppType['DOM']) {
    if (!dom.muteToggleBtn) return;

    const iconSpan = dom.muteToggleBtn.querySelector('.mute-icon');
    const textSpan = dom.muteToggleBtn.querySelector('.mute-text');

    if (app.isMuted) {
        if (iconSpan) iconSpan.textContent = '🔇';
        if (textSpan) textSpan.textContent = app.getText('modeSwitcher.muteButton.unmuteText');
        dom.muteToggleBtn.setAttribute('aria-label', app.getText('modeSwitcher.muteButton.unmuteAriaLabel'));
        dom.muteToggleBtn.setAttribute('aria-pressed', 'true');
        dom.muteToggleBtn.classList.add('muted');
    } else {
        if (iconSpan) iconSpan.textContent = '🔊';
        if (textSpan) textSpan.textContent = app.getText('modeSwitcher.muteButton.muteText');
        dom.muteToggleBtn.setAttribute('aria-label', app.getText('modeSwitcher.muteButton.muteAriaLabel'));
        dom.muteToggleBtn.setAttribute('aria-pressed', 'false');
        dom.muteToggleBtn.classList.remove('muted');
    }
}

/**
 * Toggles the mute state, saves it, updates UI, and stops audio/speech if muted.
 */
export function toggleMuteState(app: AppType, dom: AppType['DOM']) {
    app.isMuted = !app.isMuted;
    saveMuteStateToStorage(app);
    updateMuteButtonIconAndText(app, dom); // This will use app.getText

    if (app.isMuted) {
        if (app.speechSynthesisSupported && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        if (app.currentAudioElement) {
            app.currentAudioElement.pause();
        }
    }
}

/**
 * Initializes mute controls: loads state, sets initial UI, and attaches event listener.
 */
export function initializeMuteControls(app: AppType, dom: AppType['DOM']) {
    loadMuteStateFromStorage(app);
    updateMuteButtonIconAndText(app, dom); // This will use app.getText

    if(dom.muteToggleBtn) {
        dom.muteToggleBtn.addEventListener('click', () => toggleMuteState(app, dom));
    }
}
