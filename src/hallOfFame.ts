
import type { AppType, CelebratedModes } from '../index.tsx';
import { LOCAL_STORAGE_KEYS } from '../constants.ts';

type DOMType = AppType['DOM'];

export function loadCelebratedModes(app: AppType) {
    const savedCelebrated = localStorage.getItem(LOCAL_STORAGE_KEYS.celebratedModes);
    if (savedCelebrated) {
        try {
            const parsed = JSON.parse(savedCelebrated) as CelebratedModes;
            if (typeof parsed.letters === 'boolean' && typeof parsed.words === 'boolean') {
                app.celebratedModes = parsed;
            }
        } catch (e) {
            console.error('Error parsing celebrated modes:', e);
            app.celebratedModes = { letters: false, words: false };
        }
    }
}

export function saveCelebratedModes(app: AppType) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.celebratedModes, JSON.stringify(app.celebratedModes));
    } catch (e) {
        console.error('Error saving celebrated modes:', e);
    }
}

export function playCelebrationAnimation(dom: DOMType) {
    dom.confettiContainer.innerHTML = '';
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.width = Math.random() * 5 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.transform = `translateY(-20px) rotate(${Math.random() * 360}deg)`;
        dom.confettiContainer.appendChild(confetti);
    }
    setTimeout(() => {
        dom.confettiContainer.innerHTML = '';
    }, 4000);
}

export function openHallOfFameModal(app: AppType, dom: DOMType) {
    const modalTitleEl = dom.hallOfFameModal.querySelector('#hall-of-fame-modal-title');
    if (modalTitleEl) {
        modalTitleEl.innerHTML = `🎉 You're a ${app.quizMode.charAt(0).toUpperCase() + app.quizMode.slice(1)} Champion! 🎉`;
    }
    const hofModeTextEl = dom.hallOfFameModal.querySelector('#hof-completed-mode-text');
    if (hofModeTextEl) {
        hofModeTextEl.textContent = app.quizMode;
    }

    dom.hallOfFameModal.style.display = 'flex';
    dom.hallOfFameModal.setAttribute('aria-hidden', 'false');
    dom.hallOfFameTestimonialInput.value = '';
    dom.hallOfFameNameInput.value = '';
    dom.hallOfFameEmailInput.value = '';
    dom.hallOfFameModalCloseBtn.focus();
}

export function closeHallOfFameModal(dom: DOMType) {
    dom.hallOfFameModal.style.display = 'none';
    dom.hallOfFameModal.setAttribute('aria-hidden', 'true');
}

export function submitTestimonial(app: AppType, dom: DOMType) {
    const name = dom.hallOfFameNameInput.value.trim();
    const email = dom.hallOfFameEmailInput.value.trim();
    const testimonialText = dom.hallOfFameTestimonialInput.value.trim();

    if (!name) {
        app.updateFeedback('Hold on, superstar! Please enter your name for the Hall of Fame!', 'error');
        dom.hallOfFameNameInput.focus();
        return;
    }
    if (!testimonialText) {
        app.updateFeedback('Almost there! Please share your awesome story or thoughts!', 'error');
        dom.hallOfFameTestimonialInput.focus();
        return;
    }

    const subject = encodeURIComponent(`HOF Submission: ${app.quizMode.toUpperCase()} Champ - ${name}`);
    let bodyContent = `Malayalam Learning Journey - Hall of Fame Submission!\n\n`;
    bodyContent += `Name: ${name}\n`;
    if (email) {
        bodyContent += `Email: ${email}\n`;
    }
    bodyContent += `Mode Completed: ${app.quizMode}\n`;
    bodyContent += `Final Score: ${app.sessionStats[app.quizMode].score}\n\n`;
    bodyContent += `User's Awesome Story/Thoughts:\n${testimonialText}\n`;

    const body = encodeURIComponent(bodyContent);
    window.location.href = `mailto:ajaynair59@gmail.com?subject=${subject}&body=${body}`;

    app.updateFeedback('Awesome! Your story is on its way. Your email client should open.', 'success');

    setTimeout(() => {
        closeHallOfFameModal(dom);
    }, 3000);
}

export function checkCompletionAndCelebrate(app: AppType) {
    if (app.quizItems.length === 0) return;

    const currentScore = app.sessionStats[app.quizMode].score;
    const totalPossibleScore = app.quizItems.length;

    if (currentScore >= totalPossibleScore && !app.celebratedModes[app.quizMode]) {
        app.celebratedModes[app.quizMode] = true;
        saveCelebratedModes(app);
        playCelebrationAnimation(app.DOM);

        setTimeout(() => {
            openHallOfFameModal(app, app.DOM);
        }, 1500);
    }
}

export function setupHallOfFameEventListeners(app: AppType, dom: DOMType) {
    if(dom.hallOfFameModalCloseBtn) {
        dom.hallOfFameModalCloseBtn.addEventListener('click', () => closeHallOfFameModal(dom));
    }
    if(dom.submitTestimonialBtn) {
        dom.submitTestimonialBtn.addEventListener('click', () => submitTestimonial(app, dom));
    }
    if (dom.testHofBtn) {
        dom.testHofBtn.addEventListener('click', () => {
            openHallOfFameModal(app, dom);
        });
    }
}
