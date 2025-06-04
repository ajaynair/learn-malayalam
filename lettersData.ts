export interface MalayalamLetter { // Interface updated: no example fields
  id: string;
  character: string;
  displayCharacterOverride?: string;
  category: 'vowel' | 'consonant' | 'chillu' | 'kootaksharam' | 'matra';
  transliteration: string;
  audioOverride?: string;

  lastReviewedTimestamp: number;
  nextReviewTimestamp: number;
  intervalDays: number;
  easeFactor: number;
  correctStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
  reviewed: boolean;
}

// Initial data type reflects the updated MalayalamLetter interface
export const initialLettersData: Omit<MalayalamLetter, 'lastReviewedTimestamp' | 'nextReviewTimestamp' | 'intervalDays' | 'easeFactor' | 'correctStreak' | 'totalCorrect' | 'totalIncorrect' | 'reviewed'>[] = [
  // Vowels (സ്വരാക്ഷരങ്ങൾ)
  { id: 'v01', character: 'അ', category: 'vowel', transliteration: 'a' },
  { id: 'v02', character: 'ആ', category: 'vowel', transliteration: 'aa' },
  { id: 'v03', character: 'ഇ', category: 'vowel', transliteration: 'i' },
  { id: 'v04', character: 'ഈ', category: 'vowel', transliteration: 'ee' },
  { id: 'v05', character: 'ഉ', category: 'vowel', transliteration: 'u' },
  { id: 'v06', character: 'ഊ', category: 'vowel', transliteration: 'oo' },
  { id: 'v07', character: 'ഋ', category: 'vowel', transliteration: 'ru' , audioOverride: 'ഋ'},
  { id: 'v08', character: 'എ', category: 'vowel', transliteration: 'e' },
  { id: 'v09', character: 'ഏ', category: 'vowel', transliteration: 'ee' },
  { id: 'v10', character: 'ഐ', category: 'vowel', transliteration: 'ai' },
  { id: 'v11', character: 'ഒ', category: 'vowel', transliteration: 'o' },
  { id: 'v12', character: 'ഓ', category: 'vowel', transliteration: 'oo' },
  { id: 'v13', character: 'ഔ', category: 'vowel', transliteration: 'au' },
  { id: 'v14', character: 'അം', category: 'vowel', transliteration: 'am' }, // Anusvara
  { id: 'v15', character: 'അഃ', category: 'vowel', transliteration: 'ah' }, // Visarga

  // Consonants (വ്യഞ്ജനാക്ഷരങ്ങൾ)
  { id: 'c01', character: 'ക', category: 'consonant', transliteration: 'ka' },
  { id: 'c02', character: 'ഖ', category: 'consonant', transliteration: 'kha' },
  { id: 'c03', character: 'ഗ', category: 'consonant', transliteration: 'ga' },
  { id: 'c04', character: 'ഘ', category: 'consonant', transliteration: 'gha' },
  { id: 'c05', character: 'ങ', category: 'consonant', transliteration: 'nga' },
  { id: 'c06', character: 'ച', category: 'consonant', transliteration: 'cha' },
  { id: 'c07', character: 'ഛ', category: 'consonant', transliteration: 'chha' },
  { id: 'c08', character: 'ജ', category: 'consonant', transliteration: 'ja' },
  { id: 'c09', character: 'ഝ', category: 'consonant', transliteration: 'jha' },
  { id: 'c10', character: 'ഞ', category: 'consonant', transliteration: 'nja' },
  { id: 'c11', character: 'ട', category: 'consonant', transliteration: 'Ta' },
  { id: 'c12', character: 'ഠ', category: 'consonant', transliteration: 'Tha' },
  { id: 'c13', character: 'ഡ', category: 'consonant', transliteration: 'Da' },
  { id: 'c14', character: 'ഢ', category: 'consonant', transliteration: 'Dha' },
  { id: 'c15', character: 'ണ', category: 'consonant', transliteration: 'Na' },
  { id: 'c16', character: 'ത', category: 'consonant', transliteration: 'tha' },
  { id: 'c17', character: 'ഥ', category: 'consonant', transliteration: 'thha' },
  { id: 'c18', character: 'ദ', category: 'consonant', transliteration: 'da' },
  { id: 'c19', character: 'ധ', category: 'consonant', transliteration: 'dha' },
  { id: 'c20', character: 'ന', category: 'consonant', transliteration: 'na' },
  { id: 'c21', character: 'പ', category: 'consonant', transliteration: 'pa' },
  { id: 'c22', character: 'ഫ', category: 'consonant', transliteration: 'pha' },
  { id: 'c23', character: 'ബ', category: 'consonant', transliteration: 'ba' },
  { id: 'c24', character: 'ഭ', category: 'consonant', transliteration: 'bha' },
  { id: 'c25', character: 'മ', category: 'consonant', transliteration: 'ma' },
  { id: 'c26', character: 'യ', category: 'consonant', transliteration: 'ya' },
  { id: 'c27', character: 'ര', category: 'consonant', transliteration: 'ra' },
  { id: 'c28', character: 'ല', category: 'consonant', transliteration: 'la' },
  { id: 'c29', character: 'വ', category: 'consonant', transliteration: 'va' },
  { id: 'c30', character: 'ശ', category: 'consonant', transliteration: 'sha' },
  { id: 'c31', character: 'ഷ', category: 'consonant', transliteration: 'zha' },
  { id: 'c32', character: 'സ', category: 'consonant', transliteration: 'sa' },
  { id: 'c33', character: 'ഹ', category: 'consonant', transliteration: 'ha' },
  { id: 'c34', character: 'ള', category: 'consonant', transliteration: 'la' },
  { id: 'c35', character: 'ഴ', category: 'consonant', transliteration: 'zha' },
  { id: 'c36', character: 'റ', category: 'consonant', transliteration: 'ra' },

  // Chillu Aksharam (ചില്ലക്ഷരങ്ങൾ)
  { id: 'ch1', character: 'ൽ', category: 'chillu', transliteration: 'l' },
  { id: 'ch2', character: 'ൻ', category: 'chillu', transliteration: 'n' },
  { id: 'ch3', character: 'ർ', category: 'chillu', transliteration: 'r' },
  { id: 'ch4', character: 'ൾ', category: 'chillu', transliteration: 'L' },
  { id: 'ch5', character: 'ൺ', category: 'chillu', transliteration: 'n' },

  // Matras (Vowel Diacritics - സ്വരചിഹ്നങ്ങൾ)
  { id: 'm01', character: 'ാ', category: 'matra', transliteration: 'aa' },
  { id: 'm02', character: 'ി', category: 'matra', transliteration: 'e' },
  { id: 'm03', character: 'ീ', category: 'matra', transliteration: 'ee' },
  { id: 'm04', character: 'ു', category: 'matra', transliteration: 'u' },
  { id: 'm05', character: 'ൂ', category: 'matra', transliteration: 'oo' },
  { id: 'm06', character: 'ൃ', category: 'matra', transliteration: 'ru' },
  { id: 'm07', character: 'െ', category: 'matra', transliteration: 'e' },
  { id: 'm08', character: 'േ', category: 'matra', transliteration: 'ee' },
  { id: 'm09', character: 'ൈ', category: 'matra', transliteration: 'ai' },
  { id: 'm10', character: 'ൊ', category: 'matra', transliteration: 'o' },
  { id: 'm11', character: 'ോ', category: 'matra', transliteration: 'oo' },
  { id: 'm12', character: 'ൌ', category: 'matra', transliteration: 'au' },
  { id: 'm13', character: 'ം', category: 'matra', transliteration: 'am' },
  { id: 'm14', character: 'ഃ', category: 'matra', transliteration: 'ah' },

  // Kootaksharam (കൂട്ടക്ഷരങ്ങൾ - Common Ligatures)
  { id: 'k01', character: 'ക്ക', category: 'kootaksharam', transliteration: 'kka' },
  { id: 'k02', character: 'ങ്ക', category: 'kootaksharam', transliteration: 'nka' },
  { id: 'k03', character: 'ച്ച', category: 'kootaksharam', transliteration: 'chcha' },
  { id: 'k04', character: 'ഞ്ച', category: 'kootaksharam', transliteration: 'ncha' },
  { id: 'k05', character: 'ട്ട', category: 'kootaksharam', transliteration: 'tta' },
  { id: 'k06', character: 'ണ്ട', category: 'kootaksharam', transliteration: 'Nta' },
  { id: 'k07', character: 'ണ്ണ', category: 'kootaksharam', transliteration: 'NNa' },
  { id: 'k08', character: 'ത്ത', category: 'kootaksharam', transliteration: 'ththa' },
  { id: 'k09', character: 'ന്ത', category: 'kootaksharam', transliteration: 'ntha' },
  { id: 'k10', character: 'പ്പ', category: 'kootaksharam', transliteration: 'ppa' },
  { id: 'k11', character: 'മ്പ', category: 'kootaksharam', transliteration: 'mba' },
  { id: 'k12', character: 'മ്മ', category: 'kootaksharam', transliteration: 'mma' },
  { id: 'k13', character: 'യ്യ', category: 'kootaksharam', transliteration: 'yya' },
  { id: 'k14', character: 'ല്ല', category: 'kootaksharam', transliteration: 'lla' },
  { id: 'k15', character: 'വ്വ', category: 'kootaksharam', transliteration: 'vva' },
  { id: 'k16', character: 'ശ്ശ', category: 'kootaksharam', transliteration: 'shsha' },
  { id: 'k17', character: 'ക്ഷ', category: 'kootaksharam', transliteration: 'ksha' },
  { id: 'k18', character: 'ജ്ഞ', category: 'kootaksharam', transliteration: 'jnya' },
  { id: 'k19', character: 'ക്ര', category: 'kootaksharam', transliteration: 'kra' },
  { id: 'k20', character: 'പ്ര', category: 'kootaksharam', transliteration: 'pra' },
  { id: 'k21', character: 'ദ്ര', category: 'kootaksharam', transliteration: 'dra' },
  { id: 'k22', character: 'ശ്ച', category: 'kootaksharam', transliteration: 'shcha' },
  { id: 'k23', character: 'സ്ഥ', category: 'kootaksharam', transliteration: 'stha' },
];
