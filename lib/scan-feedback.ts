import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { haptic } from './haptics';

/**
 * 掃描成功提示回饋模組。
 *
 * 規則：
 * - 音效開啟（預設）：播放內建嗶聲提示音
 * - 音效關閉：以震動回饋取代
 */

const SOUND_KEY = 'qr_sound_enabled';

let soundEnabledCache: boolean | null = null;
let beepPlayer: AudioPlayer | null = null;
let audioModeReady = false;

/** 讀取音效開關設定（預設開啟） */
export async function getSoundEnabled(): Promise<boolean> {
  if (soundEnabledCache !== null) return soundEnabledCache;
  try {
    const stored = await AsyncStorage.getItem(SOUND_KEY);
    soundEnabledCache = stored === null ? true : stored === 'true';
  } catch {
    soundEnabledCache = true;
  }
  return soundEnabledCache;
}

/** 設定音效開關 */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
  soundEnabledCache = enabled;
  try {
    await AsyncStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
  } catch {
    // 忽略儲存失敗
  }
}

function ensurePlayer(): AudioPlayer | null {
  if (Platform.OS === 'web') return null;
  try {
    if (!audioModeReady) {
      audioModeReady = true;
      // iOS 靜音模式下也要能播放提示音
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    if (!beepPlayer) {
      beepPlayer = createAudioPlayer(require('../assets/sounds/beep.wav'));
      beepPlayer.volume = 1.0;
    }
    return beepPlayer;
  } catch {
    return null;
  }
}

/** 預先載入提示音，讓第一次播放不延遲 */
export function preloadScanSound(): void {
  ensurePlayer();
}

/**
 * 掃描成功回饋：
 * 音效開啟時播放嗶聲；關閉時改用震動。
 */
export async function playScanSuccessFeedback(): Promise<void> {
  const enabled = await getSoundEnabled();
  if (enabled) {
    const player = ensurePlayer();
    if (player) {
      try {
        player.seekTo(0);
        player.play();
        return;
      } catch {
        // 播放失敗時退回震動
      }
    }
  }
  haptic.light();
}
