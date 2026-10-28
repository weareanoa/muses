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
  card: string;
  audio?: string;
  from: string;
  to: string;
  themeColor: string;
  icon: string;
  iconName: string;
  colorName: string;
  height: string;
  zodiac: string;
  birthFormatted: string;
  museCategory: string;
  tagline: string;
  summary: string;
  decor: readonly MemberDecor[];
}

export const MEMBER_ORDER = ['vira', 'vely', 'mine', 'faril', 'ndah', 'liz', 'lia'] as const;

export const MEMBER_AMBIENT_PALETTE: Record<string, { primary: string; mid: string; soft: string }> = {
  vira: { primary: '#FFA7D6', mid: '#FFB8DF', soft: '#FFD4EC' },
  vely: { primary: '#1E88E5', mid: '#42A5F5', soft: '#BBDEFB' },
  mine: { primary: '#F59E0B', mid: '#FBC02D', soft: '#FEF08A' },
  faril: { primary: '#8E24AA', mid: '#AB47BC', soft: '#E1BEE7' },
  ndah: { primary: '#2E7D32', mid: '#66BB6A', soft: '#C8E6C9' },
  liz: { primary: '#E53935', mid: '#EF5350', soft: '#FFCDD2' },
  lia: { primary: '#795548', mid: '#A1887F', soft: '#D7CCC8' },
};

export const members: readonly Member[] = membersJson as readonly Member[];
