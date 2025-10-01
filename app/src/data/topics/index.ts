export type TopicWordList = {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Standard' | 'Hard';
  words: string[];
};

export const BUILT_IN_TOPICS: TopicWordList[] = [
  {
    id: 'animals-field-guide',
    name: 'Animals',
    difficulty: 'Easy',
    words: [
      'ant', 'bat', 'bear', 'bee', 'bison', 'boar', 'camel', 'cat', 'cheetah', 'clam',
      'cod', 'cow', 'crab', 'crow', 'deer', 'dog', 'dolphin', 'duck', 'eagle', 'eel',
      'falcon', 'fox', 'frog', 'goose', 'hare', 'hedgehog', 'hippo', 'horse', 'ibis',
      'ibex', 'jaguar', 'jay', 'koala', 'lemur', 'lion', 'llama', 'lynx', 'mole',
      'moose', 'octopus', 'otter', 'owl', 'ox', 'panda', 'parrot', 'perch', 'rhino',
      'robin', 'seal', 'shark', 'skunk', 'slug', 'snail', 'sparrow', 'squid', 'swan',
      'tiger', 'turkey', 'vole', 'weasel', 'whale', 'wolf', 'yak', 'zebra'
    ],
  },
  {
    id: 'space-explorers',
    name: 'Space Exploration',
    difficulty: 'Standard',
    words: [
      'apollo', 'asteroid', 'astronaut', 'atmosphere', 'cosmos', 'comet', 'command', 'capsule', 'control', 'docking',
      'eclipse', 'engineer', 'fuel', 'galaxy', 'gravity', 'gyroscope', 'habitat', 'ignition', 'ion', 'lander',
      'launch', 'liftoff', 'lunar', 'meteor', 'module', 'nebula', 'orbit', 'payload', 'perigee', 'probe',
      'radiation', 'rendezvous', 'rocket', 'satellite', 'science', 'shuttle', 'skywalk', 'solstice', 'spacewalk', 'spectrum',
      'starfield', 'sunrise', 'thruster', 'trajectory', 'transit', 'uplink', 'vacuum', 'vector', 'weightless', 'zenith'
    ],
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Life',
    difficulty: 'Standard',
    words: [
      'algae', 'anchovy', 'anemone', 'angler', 'barnacle', 'barracuda', 'bluefin', 'coral', 'current', 'dolphin',
      'eelgrass', 'flounder', 'giant', 'hammerhead', 'harbor', 'humpback', 'jellyfish', 'kelp', 'krill', 'lobster',
      'mackerel', 'mangrove', 'mantis', 'marlin', 'narwhal', 'octopus', 'orca', 'oyster', 'pelican', 'plankton',
      'porpoise', 'reef', 'sailfish', 'salmon', 'sandbar', 'seafoam', 'seagrass', 'seahorse', 'shimmer', 'sponge',
      'squid', 'stingray', 'tidepool', 'trench', 'turtle', 'urchin', 'wake', 'wave', 'whalebone', 'wrasse'
    ],
  },
  {
    id: 'summit-logbook',
    name: 'Mountain Peaks',
    difficulty: 'Standard',
    words: [
      'alps', 'andes', 'altitude', 'arête', 'avalanche', 'basecamp', 'boulder', 'butte', 'cairn', 'carabiner',
      'crag', 'crevasse', 'crystal', 'denali', 'descent', 'everest', 'foothill', 'glacier', 'granite', 'harness',
      'hiker', 'icefall', 'incline', 'jagged', 'kilimanjaro', 'ledge', 'massif', 'meridian', 'peak', 'ridge',
      'rope', 'scree', 'serac', 'sheer', 'sierra', 'slope', 'snowcap', 'summit', 'talc', 'trailhead',
      'treeline', 'valley', 'vista', 'weather', 'windbreak', 'yosemite', 'yurt', 'zenith', 'zipline', 'zigzag'
    ],
  },
  {
    id: 'herbs-and-spices',
    name: 'Culinary Herbs',
    difficulty: 'Easy',
    words: [
      'anise', 'basil', 'bay', 'bergamot', 'caraway', 'cardamom', 'cayenne', 'chervil', 'chili', 'cilantro',
      'cinnamon', 'clove', 'coriander', 'cumin', 'dill', 'fennel', 'garlic', 'ginger', 'lavender', 'lemongrass',
      'marjoram', 'mint', 'nutmeg', 'oregano', 'paprika', 'parsley', 'pepper', 'rosemary', 'saffron', 'sage',
      'salt', 'savory', 'sesame', 'shallot', 'sorrel', 'star', 'tarragon', 'thyme', 'turmeric', 'vanilla',
      'wasabi', 'zaatar', 'allspice', 'angelica', 'bayberry', 'caper', 'chive', 'fenugreek', 'galangal', 'sumac'
    ],
  },
  {
    id: 'sports-playbook',
    name: 'Sports Gear',
    difficulty: 'Standard',
    words: [
      'backboard', 'ball', 'bat', 'cleat', 'compass', 'cork', 'dartboard', 'disc', 'drybag', 'goggle',
      'goalpost', 'grip', 'handwrap', 'helmet', 'jersey', 'kayak', 'kneepad', 'lacrosse', 'mitts', 'nets',
      'padding', 'paddle', 'parka', 'pegboard', 'pennant', 'puck', 'racket', 'referee', 'scorecard', 'shinpad',
      'skate', 'sled', 'sleeve', 'snowshoe', 'stopwatch', 'surfboard', 'tackle', 'tee', 'towel', 'track',
      'umpire', 'uniform', 'visor', 'waterbottle', 'whistle', 'wicket', 'yoga', 'yoke', 'zipper', 'zorb'
    ],
  },
  {
    id: 'orchestra-pit',
    name: 'Musical Instruments',
    difficulty: 'Standard',
    words: [
      'accordion', 'bagpipe', 'banjo', 'bassoon', 'bell', 'bow', 'cello', 'clarinet', 'conga', 'coronet',
      'cymbal', 'drum', 'dulcimer', 'fiddle', 'flute', 'gong', 'guitar', 'harmonica', 'harp', 'harpsichord',
      'horn', 'keytar', 'lute', 'mandolin', 'maraca', 'melodica', 'oboe', 'ocarina', 'organ', 'piano',
      'piccolo', 'recorder', 'saxophone', 'snare', 'sousaphone', 'tambourine', 'triangle', 'trombone', 'trumpet', 'tuba',
      'ukulele', 'viola', 'violin', 'vuvuzela', 'whistle', 'xylophone', 'zither', 'amp', 'bridge', 'string'
    ],
  },
  {
    id: 'weather-watch',
    name: 'Weather Patterns',
    difficulty: 'Standard',
    words: [
      'albedo', 'atmosphere', 'barometer', 'blizzard', 'breeze', 'cirrus', 'climate', 'coriolis', 'cumulus', 'cyclone',
      'dewpoint', 'doldrums', 'downburst', 'drizzle', 'drought', 'fogbank', 'forecast', 'front', 'gust', 'hailstone',
      'humidity', 'inversion', 'isobar', 'jetstream', 'lightning', 'microburst', 'monsoon', 'nimbus', 'outflow', 'overcast',
      'pressure', 'rainfall', 'seabreeze', 'sleet', 'squall', 'storm', 'stratus', 'sunshine', 'thunder', 'tornado',
      'tradewind', 'tsunami', 'updraft', 'warmfront', 'wave', 'whiteout', 'windchill', 'winter', 'zephyr', 'zonal'
    ],
  },
  {
    id: 'code-breakers',
    name: 'Computer Science',
    difficulty: 'Hard',
    words: [
      'algorithm', 'array', 'assembler', 'binary', 'bitmask', 'boolean', 'buffer', 'cache', 'cipher', 'compiler',
      'dataset', 'debugger', 'encryption', 'frontend', 'garbage', 'graph', 'hashmap', 'heuristic', 'index', 'interface',
      'iteration', 'kernel', 'lambda', 'latency', 'linked', 'matrix', 'monad', 'mutex', 'operator', 'parameter',
      'protocol', 'quantum', 'recursion', 'refactor', 'register', 'runtime', 'scheduler', 'socket', 'stack', 'syntax',
      'thread', 'token', 'tuple', 'variable', 'vector', 'version', 'virtual', 'websocket', 'wrapper', 'zip'
    ],
  },
  {
    id: 'mythic-legends',
    name: 'World Mythology',
    difficulty: 'Hard',
    words: [
      'ambrosia', 'anansi', 'ares', 'asgard', 'athena', 'avalon', 'bifrost', 'cerberus', 'chaos', 'cyclops',
      'freya', 'fury', 'ganesha', 'gaia', 'hermes', 'hydra', 'ishtar', 'jotun', 'kami', 'kraken',
      'loki', 'midgard', 'minotaur', 'mjolnir', 'monsoon', 'nymph', 'odin', 'olympus', 'pegasus', 'phoenix',
      'raijin', 'ra', 'ragnarok', 'satyr', 'selkie', 'sirena', 'susanoo', 'thor', 'titans', 'trickster',
      'typhon', 'ullr', 'valkyrie', 'vayu', 'vishnu', 'wyrm', 'xolotl', 'yali', 'yggdrasil', 'zeus'
    ],
  },
];

export function getTopicById(id: string) {
  return BUILT_IN_TOPICS.find((topic) => topic.id === id);
}
