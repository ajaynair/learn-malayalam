
export interface ShareDetailsKeys { // Renamed interface
    titleKey: string;
    textKey: string;
}

export const LOCAL_STORAGE_KEYS = {
    letters: 'malayalamAppProgress_letters_v1',
    words: 'malayalamAppProgress_words_v1',
    mode: 'malayalamAppQuizMode_v1',
    mute: 'malayalamAppMuteState_v1',
    sessionStats: 'malayalamAppSessionStats_v1',
    celebratedModes: 'malayalamAppCelebratedModes_v1',
};

// Keys for looking up text in english.json
export const SHARE_DETAILS_KEYS: ShareDetailsKeys = {
    titleKey: 'shareDetails.title',
    textKey: 'shareDetails.text',
};

// URL remains constant
export const SHARE_URL: string = 'https://www.learn-malayalam.org/';
