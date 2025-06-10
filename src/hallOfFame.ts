
import type { AppType } from '../index.tsx';
import { saveCelebratedModesToStorage } from './quizDataHandler.ts';

type DOMType = AppType['DOM'];

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
    const modalTitleEl = dom.hallOfFameModal.querySelector<HTMLHeadingElement>('#hall-of-fame-modal-title');
    if (modalTitleEl) {
        modalTitleEl.innerHTML = app.getText('hallOfFameModal.baseTitle', { mode: app.quizMode.charAt(0).toUpperCase() + app.quizMode.slice(1) });
    }
    dom.hallOfFameModal.querySelector<HTMLSpanElement>('#hof-completed-mode-text');
// This element was in the HOF modal title, might be part of the p now

    // Set paragraph texts dynamically using app.getText
    const congratsMsgEl = dom.hofModalCongratsMessage; // Assuming this is the correct DOM element now
    if (congratsMsgEl) congratsMsgEl.innerHTML = app.getText('hallOfFameModal.congratsMessage', { mode: `<strong>${app.quizMode}</strong>` });
    // Other static texts for HoF modal are set in app.populateStaticTexts()

    dom.hallOfFameModal.style.display = 'flex';
    dom.hallOfFameModal.setAttribute('aria-hidden', 'false');
    dom.hallOfFameTestimonialInput.value = '';
    dom.hallOfFameNameInput.value = '';
    dom.hallOfFameEmailInput.value = '';
    dom.hallOfFameModalCloseBtn.focus();
}

export function closeHallOfFameModal(dom: DOMType, _app: AppType) { // app might not be needed if no getText here
    dom.hallOfFameModal.style.display = 'none';
    dom.hallOfFameModal.setAttribute('aria-hidden', 'true');
}

export function submitTestimonial(app: AppType, dom: DOMType) {
    const name = dom.hallOfFameNameInput.value.trim();
    const email = dom.hallOfFameEmailInput.value.trim();
    const testimonialText = dom.hallOfFameTestimonialInput.value.trim();

    if (!name) {
        app.updateFeedback('hallOfFameModal.feedbackNameRequired', 'error');
        dom.hallOfFameNameInput.focus();
        return;
    }
    if (!testimonialText) {
        app.updateFeedback('hallOfFameModal.feedbackStoryRequired', 'error');
        dom.hallOfFameTestimonialInput.focus();
        return;
    }

    const subject = encodeURIComponent(app.getText('hallOfFameModal.baseTitle', {mode: app.quizMode.toUpperCase()}) + ` - ${name}`); // Simplified subject
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

    app.updateFeedback('hallOfFameModal.feedbackSubmissionSuccess', 'success');

    setTimeout(() => {
        closeHallOfFameModal(dom, app);
    }, 3000);
}

export function checkCompletionAndCelebrate(app: AppType) {
    if (app.quizItems.length === 0) return;

    const currentScore = app.sessionStats[app.quizMode].score;
    const totalPossibleScore = app.quizItems.length;

    if (currentScore >= totalPossibleScore && !app.celebratedModes[app.quizMode]) {
        app.celebratedModes[app.quizMode] = true;
        saveCelebratedModesToStorage(app);
        playCelebrationAnimation(app.DOM);

        setTimeout(() => {
            openHallOfFameModal(app, app.DOM);
        }, 1500);
    }
}

export function setupHallOfFameEventListeners(app: AppType, dom: DOMType) {
    if(dom.hallOfFameModalCloseBtn) {
        dom.hallOfFameModalCloseBtn.addEventListener('click', () => closeHallOfFameModal(dom, app));
    }
    if(dom.submitTestimonialBtn) {
        dom.submitTestimonialBtn.addEventListener('click', () => submitTestimonial(app, dom));
    }
    if (dom.testHofBtn) {
        dom.testHofBtn.addEventListener('click', () => {
            // Temporarily set a mode for testing display
            // app.quizMode = 'letters'; // Or 'words'
            openHallOfFameModal(app, dom);
            // app.quizMode = originalMode; // Reset if changed
        });
    }
}
