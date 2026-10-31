import { atom } from 'nanostores';

export interface PlayingTrack {
  albumId: string;
  albumTitle: string;
  coverImage: string;
  themeColor: string;
  trackNo?: number;
  title: string;
  startAtSecond: number;
  previewAudioUrl: string;
  fallbackItunesUrl?: string;
  externalLinks: {
    spotify: string;
    youtube: string;
  };
}

export const currentTrack = atom<PlayingTrack | null>(null);
export const isPlaying = atom<boolean>(false);
export const audioCurrentTime = atom<number>(0);
export const audioDuration = atom<number>(0);
export const isVinylSpinning = atom<boolean>(false);

let globalAudio: HTMLAudioElement | null = null;
let snippetTimeout: any = null;

export function stopSnippetTimer() {
  if (snippetTimeout) {
    clearTimeout(snippetTimeout);
    snippetTimeout = null;
  }
}

export function playTrack(track: PlayingTrack, snippetDuration: number = 4) {
  if (typeof window === 'undefined') return;

  if (globalAudio) {
    globalAudio.pause();
    stopSnippetTimer();
  }

  currentTrack.set(track);
  isPlaying.set(true);
  isVinylSpinning.set(true);

  const streamUrl = track.previewAudioUrl || track.fallbackItunesUrl || '';
  if (!streamUrl) {
    console.warn('No audio URL found for track', track.title);
    return;
  }

  globalAudio = new Audio(streamUrl);
  globalAudio.currentTime = track.startAtSecond || 0;

  globalAudio.ontimeupdate = () => {
    if (globalAudio) {
      audioCurrentTime.set(globalAudio.currentTime);
      audioDuration.set(globalAudio.duration || 30);
    }
  };

  globalAudio.onended = () => {
    isPlaying.set(false);
    isVinylSpinning.set(false);
    stopSnippetTimer();
  };

  globalAudio.onerror = (e) => {
    console.error('Audio playback error, attempting fallback if available', e);
    if (track.fallbackItunesUrl && track.fallbackItunesUrl !== streamUrl && globalAudio) {
      globalAudio.src = track.fallbackItunesUrl;
      globalAudio.play().catch(console.error);
    } else {
      isPlaying.set(false);
      isVinylSpinning.set(false);
    }
  };

  globalAudio.play().catch((err) => {
    console.warn('Playback interrupted or blocked by browser policy:', err);
    isPlaying.set(false);
    isVinylSpinning.set(false);
  });

  if (snippetDuration > 0) {
    stopSnippetTimer();
    snippetTimeout = setTimeout(() => {
      if (globalAudio) {
        globalAudio.pause();
      }
      isPlaying.set(false);
      isVinylSpinning.set(false);
    }, snippetDuration * 1000);
  }
}

export function pauseAudio() {
  if (globalAudio) {
    globalAudio.pause();
  }
  stopSnippetTimer();
  isPlaying.set(false);
  isVinylSpinning.set(false);
}

export function resumeAudio() {
  if (globalAudio && currentTrack.get()) {
    globalAudio.play().then(() => {
      isPlaying.set(true);
      isVinylSpinning.set(true);
    }).catch(console.error);
  }
}

export function toggleAudio() {
  if (isPlaying.get()) {
    pauseAudio();
  } else {
    resumeAudio();
  }
}
