import type { Language } from '@shared/i18n';

export type TopicDifficulty = 'Easy' | 'Standard' | 'Hard';

export type TopicWordList = {
  id: string;
  name: string;
  difficulty: TopicDifficulty;
  words: string[];
};

type TopicCatalogEntry = {
  id: string;
  difficulty: TopicDifficulty;
  names: Record<Language, string>;
  words: Record<Language, string[]>;
};

const TOPIC_CATALOG: TopicCatalogEntry[] = [
  {
    id: 'animals-field-guide',
    difficulty: 'Easy',
    names: {
      en: 'Animals',
      he: 'בעלי חיים',
    },
    words: {
      en: [
        'ant', 'bat', 'bear', 'bee', 'bison', 'boar', 'camel', 'cat', 'cheetah', 'clam',
        'cod', 'cow', 'crab', 'crow', 'deer', 'dog', 'dolphin', 'duck', 'eagle', 'eel',
        'falcon', 'fox', 'frog', 'goose', 'hare', 'hedgehog', 'hippo', 'horse', 'ibis',
        'ibex', 'jaguar', 'jay', 'koala', 'lemur', 'lion', 'llama', 'lynx', 'mole',
        'moose', 'octopus', 'otter', 'owl', 'ox', 'panda', 'parrot', 'perch', 'rhino',
        'robin', 'seal', 'shark', 'skunk', 'slug', 'snail', 'sparrow', 'squid', 'swan',
        'tiger', 'turkey', 'vole', 'weasel', 'whale', 'wolf', 'yak', 'zebra',
      ],
      he: [
        'נמלה', 'עטלף', 'דוב', 'דבורה', 'ביזון', 'חזירבר', 'גמל', 'חתול', 'ברדלס', 'צדפה',
        'בקלה', 'פרה', 'סרטן', 'עורב', 'אייל', 'כלב', 'דולפין', 'ברווז', 'נשר', 'צלופח',
        'בז', 'שועל', 'צפרדע', 'אווז', 'ארנבת', 'קיפוד', 'היפופוטם', 'סוס', 'איביס',
        'יעל', 'יגואר', 'עורבני', 'קואלה', 'למור', 'אריה', 'למה', 'שונר', 'חפרפרת',
        'מוס', 'תמנון', 'לוטרה', 'ינשוף', 'שור', 'פנדה', 'תוכי', 'אמנון', 'קרנף',
        'אדוםחזה', 'כלביאם', 'כריש', 'בואש', 'חשופית', 'חילזון', 'דרור', 'דיונון', 'ברבור',
        'טיגריס', 'תרנגולהודו', 'נברן', 'חמוס', 'לווייתן', 'זאב', 'יאק', 'זברה',
      ],
    },
  },
  {
    id: 'space-explorers',
    difficulty: 'Standard',
    names: {
      en: 'Space Exploration',
      he: 'חקר החלל',
    },
    words: {
      en: [
        'apollo', 'asteroid', 'astronaut', 'atmosphere', 'cosmos', 'comet', 'command', 'capsule', 'control', 'docking',
        'eclipse', 'engineer', 'fuel', 'galaxy', 'gravity', 'gyroscope', 'habitat', 'ignition', 'ion', 'lander',
        'launch', 'liftoff', 'lunar', 'meteor', 'module', 'nebula', 'orbit', 'payload', 'perigee', 'probe',
        'radiation', 'rendezvous', 'rocket', 'satellite', 'science', 'shuttle', 'skywalk', 'solstice', 'spacewalk', 'spectrum',
        'starfield', 'sunrise', 'thruster', 'trajectory', 'transit', 'uplink', 'vacuum', 'vector', 'weightless', 'zenith',
      ],
      he: [
        'אפולו', 'אסטרואיד', 'אסטרונאוט', 'אטמוספירה', 'קוסמוס', 'שביט', 'פיקוד', 'קפסולה', 'בקרה', 'עגינה',
        'ליקוי', 'מהנדס', 'דלק', 'גלקסיה', 'כבידה', 'גירוסקופ', 'יחידתמגורים', 'הצתה', 'יון', 'נחתת',
        'שיגור', 'המראה', 'ירחי', 'מטאור', 'מודול', 'ערפילית', 'מסלול', 'מטען', 'פריגיאה', 'גשושית',
        'קרינה', 'מפגש', 'רקטה', 'לוויין', 'מדע', 'מעבורת', 'סקיוואלק', 'היפוך', 'ספייסווק', 'ספקטרום',
        'שדהכוכבים', 'זריחה', 'מאיץ', 'מסלולטיסה', 'מעבר', 'קישורעולה', 'ריק', 'וקטור', 'חסרמשקל', 'זנית',
      ],
    },
  },
  {
    id: 'ocean-depths',
    difficulty: 'Standard',
    names: {
      en: 'Ocean Life',
      he: 'חיים ימיים',
    },
    words: {
      en: [
        'algae', 'anchovy', 'anemone', 'angler', 'barnacle', 'barracuda', 'bluefin', 'coral', 'current', 'dolphin',
        'eelgrass', 'flounder', 'giant', 'hammerhead', 'harbor', 'humpback', 'jellyfish', 'kelp', 'krill', 'lobster',
        'mackerel', 'mangrove', 'mantis', 'marlin', 'narwhal', 'octopus', 'orca', 'oyster', 'pelican', 'plankton',
        'porpoise', 'reef', 'sailfish', 'salmon', 'sandbar', 'seafoam', 'seagrass', 'seahorse', 'shimmer', 'sponge',
        'squid', 'stingray', 'tidepool', 'trench', 'turtle', 'urchin', 'wake', 'wave', 'whalebone', 'wrasse',
      ],
      he: [
        'אצות', 'אנשובי', 'שושנתים', 'דגמנורה', 'בלוט', 'ברקודה', 'טונהכחולה', 'אלמוג', 'זרם', 'דולפין',
        'עשבצלופח', 'דגסולית', 'ענק', 'פטישן', 'נמל', 'לוויתןגבנון', 'מדוזה', 'אצתענק', 'קריל', 'לובסטר',
        'מקרל', 'מנגרוב', 'שרימפסמנטיס', 'מרלין', 'נארוול', 'תמנון', 'אורקה', 'צדפתאכילה', 'שקנאי', 'פלנקטון',
        'דלפון', 'שונית', 'דגמפרש', 'סלמון', 'לשוןחול', 'קצףים', 'צמחיאים', 'סוסוןים', 'נצנוץ', 'ספוג',
        'דיונון', 'חתולימ', 'בריכתגאות', 'תהום', 'צב', 'קיפודימ', 'שובל', 'גל', 'עצםלוויתן', 'לברקית',
      ],
    },
  },
  {
    id: 'summit-logbook',
    difficulty: 'Standard',
    names: {
      en: 'Mountain Peaks',
      he: 'פסגות הרים',
    },
    words: {
      en: [
        'alps', 'andes', 'altitude', 'arête', 'avalanche', 'basecamp', 'boulder', 'butte', 'cairn', 'carabiner',
        'crag', 'crevasse', 'crystal', 'denali', 'descent', 'everest', 'foothill', 'glacier', 'granite', 'harness',
        'hiker', 'icefall', 'incline', 'jagged', 'kilimanjaro', 'ledge', 'massif', 'meridian', 'peak', 'ridge',
        'rope', 'scree', 'serac', 'sheer', 'sierra', 'slope', 'snowcap', 'summit', 'talc', 'trailhead',
        'treeline', 'valley', 'vista', 'weather', 'windbreak', 'yosemite', 'yurt', 'zenith', 'zipline', 'zigzag',
      ],
      he: [
        'האלפים', 'האנדים', 'גובה', 'רכססכין', 'מפולתשלגים', 'מחנהליבה', 'סלע', 'תילהבודד', 'גלעד', 'קרבינה',
        'מצוק', 'בקיע', 'גביש', 'דנלי', 'ירידה', 'אוורסט', 'מורד', 'קרחון', 'גרניט', 'רתמה',
        'מטייל', 'מפלקרח', 'שיפוע', 'משונן', 'קלימנג׳רו', 'מדףסלע', 'מסיב', 'מרידיאן', 'פסגה', 'רכס',
        'חבל', 'מדרוןאבנים', 'צריחקרח', 'תלול', 'סיירה', 'מדרון', 'כיפתשלג', 'שיא', 'טלק', 'תחילתשביל',
        'גבולהיער', 'עמק', 'תצפית', 'מזגאוויר', 'שובררוח', 'יוסמיטי', 'יורטה', 'זנית', 'אומגה', 'זיגזג',
      ],
    },
  },
  {
    id: 'herbs-and-spices',
    difficulty: 'Easy',
    names: {
      en: 'Culinary Herbs',
      he: 'עשבי תיבול',
    },
    words: {
      en: [
        'anise', 'basil', 'bay', 'bergamot', 'caraway', 'cardamom', 'cayenne', 'chervil', 'chili', 'cilantro',
        'cinnamon', 'clove', 'coriander', 'cumin', 'dill', 'fennel', 'garlic', 'ginger', 'lavender', 'lemongrass',
        'marjoram', 'mint', 'nutmeg', 'oregano', 'paprika', 'parsley', 'pepper', 'rosemary', 'saffron', 'sage',
        'salt', 'savory', 'sesame', 'shallot', 'sorrel', 'star', 'tarragon', 'thyme', 'turmeric', 'vanilla',
        'wasabi', 'zaatar', 'allspice', 'angelica', 'bayberry', 'caper', 'chive', 'fenugreek', 'galangal', 'sumac',
      ],
      he: [
        'אניס', 'בזיליקום', 'עליורד', 'ברגמוט', 'קימל', 'הל', 'קאיין', 'כרתית', 'צ׳ילי', 'כוסברה',
        'קינמון', 'ציפורן', 'כוריאנדר', 'כמון', 'שמיר', 'שומר', 'שום', 'ג׳ינג׳ר', 'לבנדר', 'עשבהלימון',
        'אזובית', 'נענע', 'מוסקט', 'אורגנו', 'פפריקה', 'פטרוזיליה', 'פלפל', 'רוזמרין', 'זעפרן', 'מרווה',
        'מלח', 'איזוביון', 'שומשום', 'שאלוט', 'חומעה', 'אניסכוכב', 'טראגון', 'תימין', 'כורכום', 'וניל',
        'וואסאבי', 'זעתר', 'פלפלאנגלי', 'אנג׳ליקה', 'דפננית', 'צלף', 'עירית', 'חילבה', 'גלאנגל', 'סומאק',
      ],
    },
  },
  {
    id: 'sports-playbook',
    difficulty: 'Standard',
    names: {
      en: 'Sports Gear',
      he: 'ציוד ספורט',
    },
    words: {
      en: [
        'backboard', 'ball', 'bat', 'cleat', 'compass', 'cork', 'dartboard', 'disc', 'drybag', 'goggle',
        'goalpost', 'grip', 'handwrap', 'helmet', 'jersey', 'kayak', 'kneepad', 'lacrosse', 'mitts', 'nets',
        'padding', 'paddle', 'parka', 'pegboard', 'pennant', 'puck', 'racket', 'referee', 'scorecard', 'shinpad',
        'skate', 'sled', 'sleeve', 'snowshoe', 'stopwatch', 'surfboard', 'tackle', 'tee', 'towel', 'track',
        'umpire', 'uniform', 'visor', 'waterbottle', 'whistle', 'wicket', 'yoga', 'yoke', 'zipper', 'zorb',
      ],
      he: [
        'לוחסל', 'כדור', 'מחבט', 'נעלמסומרת', 'מצפן', 'פקק', 'לוחחיצים', 'דיסקית', 'שקאיטום', 'משקפיים',
        'משקוףשער', 'אחיזה', 'חבישתיד', 'קסדה', 'גופייתקבוצה', 'קיאק', 'מגןברך', 'לקרוס', 'כפפות', 'רשתות',
        'ריפוד', 'משוט', 'פרקה', 'לוחיתדות', 'דגלון', 'דיסקהוקי', 'רקטה', 'שופט', 'כרטיסניקוד', 'מגןשוק',
        'סקייט', 'מזחלת', 'שרוול', 'נעלשלג', 'סטופר', 'גלשן', 'טקל', 'טי', 'מגבת', 'מסלול',
        'אמפייר', 'מדים', 'מצחייה', 'בקבוקמים', 'משרוקית', 'שערקריקט', 'יוגה', 'מוטכתפיים', 'רוכסן', 'זורב',
      ],
    },
  },
  {
    id: 'orchestra-pit',
    difficulty: 'Standard',
    names: {
      en: 'Musical Instruments',
      he: 'כלי נגינה',
    },
    words: {
      en: [
        'accordion', 'bagpipe', 'banjo', 'bassoon', 'bell', 'bow', 'cello', 'clarinet', 'conga', 'coronet',
        'cymbal', 'drum', 'dulcimer', 'fiddle', 'flute', 'gong', 'guitar', 'harmonica', 'harp', 'harpsichord',
        'horn', 'keytar', 'lute', 'mandolin', 'maraca', 'melodica', 'oboe', 'ocarina', 'organ', 'piano',
        'piccolo', 'recorder', 'saxophone', 'snare', 'sousaphone', 'tambourine', 'triangle', 'trombone', 'trumpet', 'tuba',
        'ukulele', 'viola', 'violin', 'vuvuzela', 'whistle', 'xylophone', 'zither', 'amp', 'bridge', 'string',
      ],
      he: [
        'אקורדיון', 'חמתחלילים', 'בנג׳ו', 'בסון', 'פעמון', 'קשת', 'צ׳לו', 'קלרינט', 'קונגה', 'קורנט',
        'מצילה', 'תוף', 'דולצימר', 'כינורעם', 'חליל', 'גונג', 'גיטרה', 'מפוחית', 'נבל', 'צ׳מבלו',
        'קרן', 'קיטאר', 'לאוטה', 'מנדולינה', 'מרקס', 'מלודיקה', 'אובואה', 'אוקרינה', 'אורגן', 'פסנתר',
        'פיקולו', 'חלילית', 'סקסופון', 'תוףסנר', 'סוספאון', 'תוףמנענעים', 'משולש', 'טרומבון', 'חצוצרה', 'טובה',
        'יוקולילי', 'ויולה', 'כינור', 'ובוזלה', 'משרוקית', 'קסילופון', 'ציתרה', 'מגבר', 'גשר', 'מיתר',
      ],
    },
  },
  {
    id: 'weather-watch',
    difficulty: 'Standard',
    names: {
      en: 'Weather Patterns',
      he: 'תבניות מזג אוויר',
    },
    words: {
      en: [
        'albedo', 'atmosphere', 'barometer', 'blizzard', 'breeze', 'cirrus', 'climate', 'coriolis', 'cumulus', 'cyclone',
        'dewpoint', 'doldrums', 'downburst', 'drizzle', 'drought', 'fogbank', 'forecast', 'front', 'gust', 'hailstone',
        'humidity', 'inversion', 'isobar', 'jetstream', 'lightning', 'microburst', 'monsoon', 'nimbus', 'outflow', 'overcast',
        'pressure', 'rainfall', 'seabreeze', 'sleet', 'squall', 'storm', 'stratus', 'sunshine', 'thunder', 'tornado',
        'tradewind', 'tsunami', 'updraft', 'warmfront', 'wave', 'whiteout', 'windchill', 'winter', 'zephyr', 'zonal',
      ],
      he: [
        'אלבדו', 'אטמוספירה', 'ברומטר', 'סופתשלג', 'בריזה', 'עננינוצה', 'אקלים', 'קוריוליס', 'ענןערמה', 'ציקלון',
        'נקודתטל', 'שקטטרופי', 'מפלטחתון', 'טפטוף', 'בצורת', 'ערפילתעבה', 'תחזית', 'חזית', 'משב', 'אבןברד',
        'לחות', 'היפוך', 'איזובר', 'זרםסילון', 'ברק', 'מיקרופליטה', 'מונסון', 'נימבוס', 'זרםיוצא', 'שמייםמעוננים',
        'לחץ', 'משקעים', 'בריזהימית', 'גשםקרח', 'סערהפתאומית', 'סערה', 'ענןשכבה', 'אורשמש', 'רעם', 'טורנדו',
        'רוחסחרים', 'צונאמי', 'תרומיתרוח', 'חזיתחמה', 'גל', 'עיוורוןשלג', 'קוררוח', 'חורף', 'זפיר', 'זורי',
      ],
    },
  },
  {
    id: 'code-breakers',
    difficulty: 'Hard',
    names: {
      en: 'Computer Science',
      he: 'מדעי המחשב',
    },
    words: {
      en: [
        'algorithm', 'array', 'assembler', 'binary', 'bitmask', 'boolean', 'buffer', 'cache', 'cipher', 'compiler',
        'dataset', 'debugger', 'encryption', 'frontend', 'garbage', 'graph', 'hashmap', 'heuristic', 'index', 'interface',
        'iteration', 'kernel', 'lambda', 'latency', 'linked', 'matrix', 'monad', 'mutex', 'operator', 'parameter',
        'protocol', 'quantum', 'recursion', 'refactor', 'register', 'runtime', 'scheduler', 'socket', 'stack', 'syntax',
        'thread', 'token', 'tuple', 'variable', 'vector', 'version', 'virtual', 'websocket', 'wrapper', 'zip',
      ],
      he: [
        'אלגוריתם', 'מערך', 'אסמבלר', 'בינארי', 'מסכתביט', 'בוליאני', 'חוצץ', 'מטמון', 'צופן', 'מהדר',
        'מערךנתונים', 'מדבג', 'הצפנה', 'פרונטאנד', 'אשפה', 'גרף', 'מפתהאשים', 'היוריסטיקה', 'אינדקס', 'ממשק',
        'איטרציה', 'ליבה', 'למדא', 'זמןשהייה', 'מקושר', 'מטריצה', 'מונאדה', 'מוטקס', 'אופרטור', 'פרמטר',
        'פרוטוקול', 'קוונטי', 'רקורסיה', 'ריפקטור', 'אוגר', 'זמןריצה', 'מתזמן', 'שקע', 'מחסנית', 'תחביר',
        'תהליךקל', 'אסימון', 'טופל', 'משתנה', 'וקטור', 'גרסה', 'וירטואלי', 'וובסוקט', 'עוטף', 'זיפ',
      ],
    },
  },
  {
    id: 'mythic-legends',
    difficulty: 'Hard',
    names: {
      en: 'World Mythology',
      he: 'מיתולוגיה עולמית',
    },
    words: {
      en: [
        'ambrosia', 'anansi', 'ares', 'asgard', 'athena', 'avalon', 'bifrost', 'cerberus', 'chaos', 'cyclops',
        'freya', 'fury', 'ganesha', 'gaia', 'hermes', 'hydra', 'ishtar', 'jotun', 'kami', 'kraken',
        'loki', 'midgard', 'minotaur', 'mjolnir', 'monsoon', 'nymph', 'odin', 'olympus', 'pegasus', 'phoenix',
        'raijin', 'ra', 'ragnarok', 'satyr', 'selkie', 'sirena', 'susanoo', 'thor', 'titans', 'trickster',
        'typhon', 'ullr', 'valkyrie', 'vayu', 'vishnu', 'wyrm', 'xolotl', 'yali', 'yggdrasil', 'zeus',
      ],
      he: [
        'אמברוסיה', 'אננסי', 'ארס', 'אסגרד', 'אתנה', 'אוולון', 'ביפרוסט', 'קרברוס', 'כאוס', 'קיקלופ',
        'פריה', 'אריניה', 'גאנשה', 'גאיה', 'הרמס', 'הידרה', 'אשתר', 'יוטון', 'קמי', 'קרקן',
        'לוקי', 'מידגארד', 'מינוטאור', 'מיולניר', 'מונסון', 'נימפה', 'אודין', 'אולימפוס', 'פגסוס', 'פניקס',
        'ראייג׳ין', 'רע', 'רגנרוק', 'סאטיר', 'סלקי', 'סירנה', 'סוסאנו', 'ת׳ור', 'טיטאנים', 'תעלולן',
        'טיפון', 'אולר', 'ולקירי', 'ואיו', 'וישנו', 'וורם', 'שולוטל', 'יאלי', 'יגדרסיל', 'זאוס',
      ],
    },
  },
];

function localizeTopic(entry: TopicCatalogEntry, language: Language): TopicWordList {
  return {
    id: entry.id,
    difficulty: entry.difficulty,
    name: entry.names[language] ?? entry.names.en,
    words: entry.words[language] ?? entry.words.en,
  };
}

export function listTopics(language: Language): TopicWordList[] {
  return TOPIC_CATALOG.map((entry) => localizeTopic(entry, language));
}

export function getTopicById(id: string, language: Language): TopicWordList | undefined {
  const entry = TOPIC_CATALOG.find((topic) => topic.id === id);
  return entry ? localizeTopic(entry, language) : undefined;
}

export function getRandomTopic(language: Language, excludeId?: string): TopicWordList | undefined {
  const pool = excludeId ? TOPIC_CATALOG.filter((topic) => topic.id !== excludeId) : TOPIC_CATALOG;
  if (pool.length === 0) {
    return undefined;
  }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return localizeTopic(picked, language);
}
