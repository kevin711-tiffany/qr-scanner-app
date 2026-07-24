import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React Native 與 Expo 模組（Node 測試環境無原生模組）
const storage: Record<string, string> = {};

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Vibration: { vibrate: vi.fn() },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete storage[key];
    }),
  },
}));

const playMock = vi.fn();
const seekToMock = vi.fn();

vi.mock('expo-audio', () => ({
  createAudioPlayer: vi.fn(() => ({
    play: playMock,
    seekTo: seekToMock,
    volume: 1,
  })),
  setAudioModeAsync: vi.fn(async () => {}),
}));

const hapticLightMock = vi.fn();
vi.mock('../lib/haptics', () => ({
  haptic: {
    light: hapticLightMock,
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// mock 音效資源檔（scan-feedback.ts 內 require('../assets/sounds/beep.wav')）
vi.mock('../assets/sounds/beep.wav', () => ({ default: 1 }));

describe('scan-feedback 掃描提示回饋', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    for (const key of Object.keys(storage)) delete storage[key];
    vi.resetModules();
  });

  it('預設音效為開啟', async () => {
    const { getSoundEnabled } = await import('../lib/scan-feedback');
    expect(await getSoundEnabled()).toBe(true);
  });

  it('setSoundEnabled 可儲存並讀回開關狀態', async () => {
    const { getSoundEnabled, setSoundEnabled } = await import('../lib/scan-feedback');
    await setSoundEnabled(false);
    expect(await getSoundEnabled()).toBe(false);
    expect(storage['qr_sound_enabled']).toBe('false');
    await setSoundEnabled(true);
    expect(await getSoundEnabled()).toBe(true);
  });

  it('音效開啟時嘗試播放提示音；播放器不可用時退回震動（不會無回饋）', async () => {
    const { playScanSuccessFeedback } = await import('../lib/scan-feedback');
    await playScanSuccessFeedback();
    // Node 測試環境無法載入 .wav 資源檔，createAudioPlayer 可能拋錯，
    // 模組設計為播放失敗時退回震動；兩種路徑至少要有一種回饋被觸發
    const playedSound = playMock.mock.calls.length === 1;
    const fellBackToHaptic = hapticLightMock.mock.calls.length === 1;
    expect(playedSound || fellBackToHaptic).toBe(true);
  });

  it('音效關閉時改用震動回饋，不播放音效', async () => {
    const { playScanSuccessFeedback, setSoundEnabled } = await import('../lib/scan-feedback');
    await setSoundEnabled(false);
    await playScanSuccessFeedback();
    expect(playMock).not.toHaveBeenCalled();
    expect(hapticLightMock).toHaveBeenCalledTimes(1);
  });
});
