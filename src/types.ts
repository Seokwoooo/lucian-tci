export const DOMAIN_CODES = ['NS', 'HA', 'RD', 'P', 'SD', 'C', 'ST'] as const;
export type DomainCode = (typeof DOMAIN_CODES)[number];
export type Response = 1 | 2 | 3 | 4 | 5;
export type Answers = Record<string, Response>;
export interface Item {
  id: string;
  domain: DomainCode;
  subscale: string;
  english: string;
  korean: string;
  reverse: boolean;
  source: string;
  version: string;
  reviewNotes?: string[];
}
export interface Subscale {
  code: string;
  domain: DomainCode;
  english: string;
  name: string;
  description: string;
  low: string;
  high: string;
  caution?: string;
}
export interface Domain {
  code: DomainCode;
  name: string;
  everyday: string;
  description: string;
  low: string;
  high: string;
  caution: string;
  color: string;
}
export interface SubscaleScore { code: string; domain: DomainCode; count: number; sum: number; mean: number }
export interface DomainScore { code: DomainCode; mean: number; subscales: string[] }
export interface ScoreResult { subscales: SubscaleScore[]; domains: DomainScore[]; answered: number }
