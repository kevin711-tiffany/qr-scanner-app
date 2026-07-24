import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * 跨平台觸覺回饋工具。
 *
 * 背景：expo-haptics 在 iOS 直接對應 Taptic Engine，震動明顯；
 * 但在 Android 上是以 Vibrator 模擬的極短脈衝，許多機型幾乎無感。
 * 因此在 Android 改用 React Native 的 Vibration API 送出
 * 明確的震動模式，確保使用者能感覺到回饋。
 */

function vibrateAndroid(pattern: number | number[]) {
  try {
    if (typeof pattern === 'number') {
      Vibration.vibrate(pattern);
    } else {
      Vibration.vibrate(pattern);
    }
  } catch {
    // 忽略震動失敗（例如裝置不支援）
  }
}

export const haptic = {
  /** 輕度回饋：按鈕點擊、掃描讀取成功 */
  light: () => {
    if (Platform.OS === 'android') {
      vibrateAndroid(60);
    } else if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  /** 成功回饋：傳送成功、儲存成功 */
  success: () => {
    if (Platform.OS === 'android') {
      // 兩短震表示成功：[延遲, 震動, 停頓, 震動]
      vibrateAndroid([0, 80, 80, 80]);
    } else if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  /** 警告回饋：重複掃描等 */
  warning: () => {
    if (Platform.OS === 'android') {
      vibrateAndroid([0, 120, 100, 120]);
    } else if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  /** 錯誤回饋：傳送失敗、格式錯誤 */
  error: () => {
    if (Platform.OS === 'android') {
      // 一長震表示錯誤
      vibrateAndroid(300);
    } else if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
