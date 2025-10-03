import type { Language } from '@shared/i18n';
import type { TopicCatalogEntry, TopicWordList, TopicDifficulty } from './types';

// Topic metadata for listing without loading full data
export interface TopicMetadata {
  id: string;
  difficulty: TopicDifficulty;
  names: Record<Language, string>;
}

// Registry of all available topics with lazy loading
const TOPIC_REGISTRY: Record<string, {
  metadata: TopicMetadata;
  loader: () => Promise<TopicCatalogEntry>;
}> = {
  'animals-field-guide': {
    metadata: {
      id: 'animals-field-guide',
      difficulty: 'Easy',
      names: {
        en: 'Animals',
        he: 'בעלי חיים',
      },
    },
    loader: () => import('./animals-field-guide').then(m => m.animalsFieldGuide),
  },
  'space-explorers': {
    metadata: {
      id: 'space-explorers',
      difficulty: 'Standard',
      names: {
        en: 'Space Exploration',
        he: 'חקר החלל',
      },
    },
    loader: () => import('./space-explorers').then(m => m.spaceExplorers),
  },
  'ocean-depths': {
    metadata: {
      id: 'ocean-depths',
      difficulty: 'Standard',
      names: {
        en: 'Ocean Life',
        he: 'חיים ימיים',
      },
    },
    loader: () => import('./ocean-depths').then(m => m.oceanDepths),
  },
  'summit-logbook': {
    metadata: {
      id: 'summit-logbook',
      difficulty: 'Standard',
      names: {
        en: 'Mountain Peaks',
        he: 'פסגות הרים',
      },
    },
    loader: () => import('./summit-logbook').then(m => m.summitLogbook),
  },
  'herbs-and-spices': {
    metadata: {
      id: 'herbs-and-spices',
      difficulty: 'Easy',
      names: {
        en: 'Culinary Herbs',
        he: 'עשבי תיבול',
      },
    },
    loader: () => import('./herbs-and-spices').then(m => m.herbsAndSpices),
  },
  'sports-playbook': {
    metadata: {
      id: 'sports-playbook',
      difficulty: 'Standard',
      names: {
        en: 'Sports Gear',
        he: 'ציוד ספורט',
      },
    },
    loader: () => import('./sports-playbook').then(m => m.sportsPlaybook),
  },
  'orchestra-pit': {
    metadata: {
      id: 'orchestra-pit',
      difficulty: 'Standard',
      names: {
        en: 'Musical Instruments',
        he: 'כלי נגינה',
      },
    },
    loader: () => import('./orchestra-pit').then(m => m.orchestraPit),
  },
  'weather-watch': {
    metadata: {
      id: 'weather-watch',
      difficulty: 'Standard',
      names: {
        en: 'Weather Patterns',
        he: 'תבניות מזג אוויר',
      },
    },
    loader: () => import('./weather-watch').then(m => m.weatherWatch),
  },
  'code-breakers': {
    metadata: {
      id: 'code-breakers',
      difficulty: 'Hard',
      names: {
        en: 'Computer Science',
        he: 'מדעי המחשב',
      },
    },
    loader: () => import('./code-breakers').then(m => m.codeBreakers),
  },
  'mythic-legends': {
    metadata: {
      id: 'mythic-legends',
      difficulty: 'Hard',
      names: {
        en: 'World Mythology',
        he: 'מיתולוגיה עולמית',
      },
    },
    loader: () => import('./mythic-legends').then(m => m.mythicLegends),
  },
};

function localizeTopic(entry: TopicCatalogEntry, language: Language): TopicWordList {
  return {
    id: entry.id,
    difficulty: entry.difficulty,
    name: entry.names[language] ?? entry.names.en,
    words: entry.words[language] ?? entry.words.en,
  };
}

/**
 * Get topic metadata for listing without loading full data
 */
export function listTopicMetadata(language: Language): Array<{
  id: string;
  name: string;
  difficulty: TopicDifficulty;
}> {
  return Object.values(TOPIC_REGISTRY).map(({ metadata }) => ({
    id: metadata.id,
    name: metadata.names[language] ?? metadata.names.en,
    difficulty: metadata.difficulty,
  }));
}

/**
 * Load a specific topic by ID (lazy-loaded)
 */
export async function loadTopicById(id: string, language: Language): Promise<TopicWordList | undefined> {
  const topicEntry = TOPIC_REGISTRY[id];
  if (!topicEntry) {
    return undefined;
  }

  try {
    const entry = await topicEntry.loader();
    return localizeTopic(entry, language);
  } catch (error) {
    console.error(`Failed to load topic ${id}:`, error);
    return undefined;
  }
}

/**
 * Load a random topic (lazy-loaded)
 */
export async function loadRandomTopic(language: Language, excludeId?: string): Promise<TopicWordList | undefined> {
  const availableIds = Object.keys(TOPIC_REGISTRY).filter(id => id !== excludeId);
  if (availableIds.length === 0) {
    return undefined;
  }

  const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
  return loadTopicById(randomId, language);
}

/**
 * Preload multiple topics for better performance
 */
export async function preloadTopics(ids: string[]): Promise<void> {
  const loadPromises = ids
    .filter(id => TOPIC_REGISTRY[id])
    .map(id => TOPIC_REGISTRY[id].loader());

  try {
    await Promise.all(loadPromises);
  } catch (error) {
    console.warn('Some topics failed to preload:', error);
  }
}