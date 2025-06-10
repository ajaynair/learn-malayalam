
export interface ShareDetails {
    title: string;
    text: string;
    url: string;
}

export const LOCAL_STORAGE_KEYS = {
    letters: 'malayalamAppProgress_letters_v1',
    words: 'malayalamAppProgress_words_v1',
    mode: 'malayalamAppQuizMode_v1',
    mute: 'malayalamAppMuteState_v1',
    sessionStats: 'malayalamAppSessionStats_v1',
    celebratedModes: 'malayalamAppCelebratedModes_v1',
};

export const SHARE_DETAILS: ShareDetails = {
    title: 'Learn Malayalam Free: Letters, Alphabet & Words | Interactive Quiz',
    text: 'Discover the fun, free way to learn the Malayalam alphabet and words with this interactive quiz app! Master the script with audio, spaced repetition, and engaging exercises.',
    url: 'https://www.learn-malayalam.org/'
};
