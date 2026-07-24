import { useEffect } from 'react';
import { subscribeTabReset } from '@/lib/tab-reset';

/**
 * 訂閱「再次點擊同一分頁」的重置訊號。
 * 在功能頁中使用：useTabReset('scan', () => { ...重置畫面狀態... });
 * handler 不需要 useCallback 包裝，內部會取用最新的 handler。
 */
export function useTabReset(tabName: string, handler: () => void) {
  useEffect(() => {
    const unsubscribe = subscribeTabReset(tabName, handler);
    return unsubscribe;
  });
}
