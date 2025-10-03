import type { Language } from '@shared/i18n';

export type TopicDifficulty = 'Easy' | 'Standard' | 'Hard';

export type TopicWordList = {
  id: string;
  name: string;
  difficulty: TopicDifficulty;
  words: string[];
};

export type TopicCatalogEntry = {
  id: string;
  difficulty: TopicDifficulty;
  names: Record<Language, string>;
  words: Record<Language, string[]>;
};