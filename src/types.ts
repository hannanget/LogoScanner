export interface LogoResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  sourceUrl: string;
  width?: number;
  height?: number;
}

export type SearchSource = 'all' | 'freelancer.com' | 'behance.net' | 'dribbble.com' | '99designs.com';
