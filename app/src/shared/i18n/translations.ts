export type Language = 'en' | 'he';

export interface Translations {
  // App titles
  appTitle: string;
  appSubtitle: string;
  
  // Navigation and actions
  start: string;
  startWithTopic: (topic: string) => string;
  pause: string;
  resume: string;
  restart: string;
  restartRound: string;
  changeTopic: string;
  back: string;
  
  // Game UI
  credits: string;
  topic: string;
  difficulty: string;
  status: string;
  wordList: string;
  wordsWillAppear: string;
  
  // Game states
  victory: string;
  outOfCredits: string;
  creditsDepleted: string;
  playing: string;
  allWordsComplete: string;
  paused: string;
  tapStartToPlay: string;
  
  // Stats and labels
  wins: string;
  currentStreak: string;
  bestCreditsRemaining: string;
  lifetimeWins: string;
  roundsPlayed: string;
  
  // Settings
  settings: string;
  topicPreference: string;
  random: string;
  randomRecommended: string;
  dropSpeed: string;
  noiseLetters: string;
  reducedMotion: string;
  language: string;
  
  // Difficulty levels
  easy: string;
  standard: string;
  hard: string;
  
  // Speed settings
  slow: string;
  normal: string;
  fast: string;
  
  // Help content
  help: string;
  howToPlay: string;
  helpStep1: string;
  helpStep2: string;
  helpStep3: string;
  helpStep4: string;
  needRefresher: string;
  replayOnboarding: string;
  
  // About
  about: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutBuild: string;
  aboutPrivacy: string;
  
  // Onboarding
  onboardingTitle1: string;
  onboardingBody1: string;
  onboardingTitle2: string;
  onboardingBody2: string;
  onboardingTitle3: string;
  onboardingBody3: string;
  
  // Round Summary
  gamePaused: string;
  pauseMessage: string;
  victoryMessage: string;
  lossMessage: string;
  
  // Misc
  selectedTopic: string;
  pickTopic: string;
  low: string;
  nudgingNeededLetter: string;
  quickStartHint: string;
  close: string;
  readAbout: string;
  milestoneNote: string;
  mute: string;
  unmute: string;
  
  // Session history
  recentSessions: string;
  won: string;
  lost: string;
  creditsLeft: string;
  
  // Feedback messages
  greatCatch: string;
  missedLetter: string;
  boostingNeeded: string;
  randomTopic: string;
  
  // Onboarding
  welcomeTo: string;
  tenSecondTour: string;
  letsPlay: string;
  
  // Construction Bar
  targetWord: string;
  progress: string;
  tray: string;
  autoSelectingNext: string;
  tapLettersToBuild: string;
  
  // Error Boundary
  errorBoundary?: {
    title: string;
    message: string;
    technicalDetails: string;
    retry: string;
    reload: string;
  };
  
  // Game Errors
  gameError?: {
    canvasTitle: string;
    canvasMessage: string;
    reload: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    // App titles
    appTitle: 'LetterFall',
    appSubtitle: 'Catch falling letters, finish five topic words, and keep credits above zero.',
    
    // Navigation and actions
    start: 'Start',
    startWithTopic: (topic: string) => `Start — ${topic}`,
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    restartRound: 'Restart Round',
    changeTopic: 'Change Topic',
    back: 'Back',
    
    // Game UI
    credits: 'Credits',
    topic: 'Topic',
    difficulty: 'Difficulty',
    status: 'Status',
    wordList: 'Word List',
    wordsWillAppear: 'Words will appear here once a round starts.',
    
    // Game states
    victory: 'Victory',
    outOfCredits: 'Out of credits',
    creditsDepleted: 'Credits depleted',
    playing: 'Playing',
    allWordsComplete: 'All words complete!',
    paused: 'Paused',
    tapStartToPlay: 'Tap Start to play',
    
    // Stats and labels
    wins: 'Wins',
    currentStreak: 'Current streak',
    bestCreditsRemaining: 'Best credits remaining',
    lifetimeWins: 'Lifetime wins',
    roundsPlayed: 'Rounds played',
    
    // Settings
    settings: 'Settings',
    topicPreference: 'Topic preference',
    random: 'Random',
    randomRecommended: 'Random (recommended)',
    dropSpeed: 'Drop speed',
    noiseLetters: 'Noise letters',
    reducedMotion: 'Reduced motion',
    language: 'Language',
    
    // Difficulty levels
    easy: 'Easy',
    standard: 'Standard',
    hard: 'Hard',
    
    // Speed settings
    slow: 'Slow',
    normal: 'Normal',
    fast: 'Fast',
    
    // Help content
    help: 'Help',
    howToPlay: 'How to Play',
    helpStep1: 'Tap Start to jump into a random topic.',
    helpStep2: 'Choose a word in the sidebar to target it.',
    helpStep3: 'Catch matching letters in order; missed letters drain credits.',
    helpStep4: 'Finish five words before credits reach zero to win.',
    needRefresher: 'Need a refresher?',
    replayOnboarding: 'Replay onboarding',
    
    // About
    about: 'About',
    aboutTitle: 'About LetterFall',
    aboutDescription: 'LetterFall blends topic-driven word challenges with an arcade flow.',
    aboutBuild: 'This build is an early milestone focused on the project scaffold and UI shell.',
    aboutPrivacy: 'No data is collected; everything runs locally.',
    
    // Onboarding
    onboardingTitle1: 'Falling Letters',
    onboardingBody1: 'Catch letters in the main arena. Missed letters drain credits, so move fast!',
    onboardingTitle2: 'Word List',
    onboardingBody2: 'Tap a word on the right to target it. Progress bars show how close you are.',
    onboardingTitle3: 'Construction Tray',
    onboardingBody3: 'The tray at the bottom shows your in-order progress and the next required letter.',
    
    // Round Summary
    gamePaused: 'Game Paused',
    pauseMessage: 'Take a breather. Credits stay frozen while you\'re paused.',
    victoryMessage: 'All five words completed before the credit meter emptied.',
    lossMessage: 'The credit meter hit zero. Try again with a fresh round.',
    
    // Misc
    selectedTopic: 'Selected topic',
    pickTopic: 'Pick a topic',
    low: 'Low',
    nudgingNeededLetter: 'Nudging needed letter…',
    quickStartHint: 'Quick Start uses this topic when set. Leave on Random for surprise rounds.',
    close: 'Close',
    readAbout: 'Read About LetterFall',
    milestoneNote: 'This milestone focuses on the UI shell and layout. Gameplay systems, fairness guard, audio, and onboarding overlays will ship in later phases described in the spec.',
    mute: 'Mute',
    unmute: 'Unmute',
    
    // Session history
    recentSessions: 'Recent Sessions',
    won: 'Won',
    lost: 'Lost',
    creditsLeft: 'credits left',
    
    // Feedback messages
    greatCatch: 'Great catch!',
    missedLetter: 'Missed letter — stay sharp!',
    boostingNeeded: 'Boosting needed letters…',
    randomTopic: 'Random topic',
    
    // Onboarding
    welcomeTo: 'Welcome to',
    tenSecondTour: 'Here\'s a 10-second tour of the three key areas.',
    letsPlay: 'Let\'s Play',
    
    // Construction Bar
    targetWord: 'Target word',
    progress: 'Progress',
    tray: 'Tray',
    autoSelectingNext: 'Auto-selecting next word',
    tapLettersToBuild: 'Tap letters to build',
    
    // Error Boundary
    errorBoundary: {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.',
      technicalDetails: 'Technical Details',
      retry: 'Try Again',
      reload: 'Reload Page',
    },
    
    // Game Errors
    gameError: {
      canvasTitle: 'Game Rendering Error',
      canvasMessage: 'Unable to initialize the game renderer. This may be due to browser compatibility issues or graphics driver problems.',
      reload: 'Reload Game',
    },
  },
  
  he: {
    // App titles
    appTitle: 'מפל האותיות',
    appSubtitle: 'תפסו אותיות נופלות, השלימו חמש מילים בנושא, ושמרו על הנקודות מעל אפס.',
    
    // Navigation and actions
    start: 'התחל',
    startWithTopic: (topic: string) => `התחל — ${topic}`,
    pause: 'השהה',
    resume: 'המשך',
    restart: 'התחל מחדש',
    restartRound: 'התחל סיבוב מחדש',
    changeTopic: 'שנה נושא',
    back: 'חזור',
    
    // Game UI
    credits: 'נקודות',
    topic: 'נושא',
    difficulty: 'קושי',
    status: 'מצב',
    wordList: 'רשימת מילים',
    wordsWillAppear: 'מילים יופיעו כאן כשהסיבוב יתחיל.',
    
    // Game states
    victory: 'ניצחון',
    outOfCredits: 'נגמרו הנקודות',
    creditsDepleted: 'הנקודות התרוקנו',
    playing: 'משחק',
    allWordsComplete: 'כל המילים הושלמו!',
    paused: 'מושהה',
    tapStartToPlay: 'לחצו על התחל כדי לשחק',
    
    // Stats and labels
    wins: 'ניצחונות',
    currentStreak: 'רצף נוכחי',
    bestCreditsRemaining: 'הכי הרבה נקודות שנשארו',
    lifetimeWins: 'ניצחונות בכל הזמנים',
    roundsPlayed: 'סיבובים ששוחקו',
    
    // Settings
    settings: 'הגדרות',
    topicPreference: 'העדפת נושא',
    random: 'אקראי',
    randomRecommended: 'אקראי (מומלץ)',
    dropSpeed: 'מהירות נפילה',
    noiseLetters: 'אותיות רעש',
    reducedMotion: 'תנועה מופחתת',
    language: 'שפה',
    
    // Difficulty levels
    easy: 'קל',
    standard: 'רגיל',
    hard: 'קשה',
    
    // Speed settings
    slow: 'איטי',
    normal: 'רגיל',
    fast: 'מהיר',
    
    // Help content
    help: 'עזרה',
    howToPlay: 'איך לשחק',
    helpStep1: 'לחצו על התחל כדי להיכנס לנושא אקראי.',
    helpStep2: 'בחרו מילה בסרגל הצד כדי לכוון אליה.',
    helpStep3: 'תפסו אותיות מתאימות לפי הסדר; אותיות שמפוספסות מזיקות לנקודות.',
    helpStep4: 'השלימו חמש מילים לפני שהנקודות מגיעות לאפס כדי לנצח.',
    needRefresher: 'צריכים רענון?',
    replayOnboarding: 'השמיעו את המבוא מחדש',
    
    // About
    about: 'אודות',
    aboutTitle: 'אודות מפל האותיות',
    aboutDescription: 'מפל האותיות מערבב אתגרי מילים מונחי נושא עם זרימת ארקייד.',
    aboutBuild: 'הגרסה הזו היא אבן דרך מוקדמת המתמקדת בפיגום הפרויקט ומעטפת הממשק.',
    aboutPrivacy: 'אין איסוף נתונים; הכל רץ מקומית.',
    
    // Onboarding
    onboardingTitle1: 'אותיות נופלות',
    onboardingBody1: 'תפסו אותיות בזירה הראשית. אותיות שמפוספסות מזיקות לנקודות, אז זוזו מהר!',
    onboardingTitle2: 'רשימת מילים',
    onboardingBody2: 'לחצו על מילה בצד ימין כדי לכוון אליה. פסי התקדמות מראים כמה אתם קרובים.',
    onboardingTitle3: 'מגש הבנייה',
    onboardingBody3: 'המגש בתחתית מראה את ההתקדמות שלכם לפי הסדר ואת האות הבאה הנדרשת.',
    
    // Round Summary
    gamePaused: 'המשחק מושהה',
    pauseMessage: 'קחו נשימה. הנקודות נשארות קפואות בזמן שאתם מושהים.',
    victoryMessage: 'כל חמש המילים הושלמו לפני שמטר הנקודות התרוקן.',
    lossMessage: 'מטר הנקודות הגיע לאפס. נסו שוב עם סיבוב חדש.',
    
    // Misc
    selectedTopic: 'נושא נבחר',
    pickTopic: 'בחרו נושא',
    low: 'נמוך',
    nudgingNeededLetter: 'מזרז את האות הנדרשת…',
    quickStartHint: 'התחלה מהירה משתמשת בנושא הזה כשהוא מוגדר. השאירו על אקראי לסיבובי הפתעה.',
    close: 'סגור',
    readAbout: 'קראו על מפל האותיות',
    milestoneNote: 'אבן הדרך הזו מתמקדת במעטפת ופריסת הממשק. מערכות המשחק, שמירת ההוגנות, אודיו ומעטפות ההדרכה ישוחררו בשלבים מאוחרים יותר המתוארים במפרט.',
    mute: 'השתק',
    unmute: 'בטל השתקה',
    
    // Session history
    recentSessions: 'משחקים אחרונים',
    won: 'ניצחון',
    lost: 'הפסד',
    creditsLeft: 'נקודות שנשארו',
    
    // Feedback messages  
    greatCatch: 'תפיסה מעולה!',
    missedLetter: 'פספסתם אות - היו חדים!',
    boostingNeeded: 'מחזק את האותיות הנדרשות…',
    randomTopic: 'נושא אקראי',
    
    // Onboarding
    welcomeTo: 'ברוכים הבאים אל',
    tenSecondTour: 'הנה סיור של 10 שניות בשלושת האזורים המרכזיים.',
    letsPlay: 'בואו נשחק',
    
    // Construction Bar
    targetWord: 'מילת יעד',
    progress: 'התקדמות',
    tray: 'מגש',
    autoSelectingNext: 'בחירה אוטומטית של המילה הבאה',
    tapLettersToBuild: 'הקישו על אותיות לבנייה',
    
    // Error Boundary
    errorBoundary: {
      title: 'משהו השתבש',
      message: 'אירעה שגיאה בלתי צפויה. אנא נסו לרענן את הדף או פנו לתמיכה אם הבעיה נמשכת.',
      technicalDetails: 'פרטים טכניים',
      retry: 'נסו שוב',
      reload: 'רעננו דף',
    },
    
    // Game Errors
    gameError: {
      canvasTitle: 'שגיאת עיבוד משחק',
      canvasMessage: 'לא ניתן לאתחל את מעבד המשחק. זה עלול להיות בגלל בעיות תאימות דפדפן או בעיות מנהל התקן גרפי.',
      reload: 'רעננו משחק',
    },
  }
};
