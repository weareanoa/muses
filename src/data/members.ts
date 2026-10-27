import membersJson from './members.json';

export interface MemberDecor {
  src: string;
  x: string;
  y?: string;
  bottom?: string;
  size: number;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
  behind?: boolean;
}

export interface Member {
  id: string;
  name: string;
  stageName: string;
  fullName: string;
  role: string;
  card: string;
  from: string;
  to: string;
  themeColor: string;
  accentColor?: string;
  gradientStart: string;
  gradientEnd: string;
  bgTint: string;
  icon: string;
  iconName: string;
  colorName: string;
  height: string;
  zodiac: string;
  birthFormatted: string;
  birthDate?: string;
  museCategory: string;
  tagline: string;
  heroSubtitle?: string;
  summary: string;
  story01: string;
  decor: readonly MemberDecor[];
}

export const members: readonly Member[] = membersJson as readonly Member[];

export default members;
