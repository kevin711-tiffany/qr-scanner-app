import { describe, it, expect, vi } from 'vitest';
import { subscribeTabReset, emitTabReset } from '../lib/tab-reset';

describe('tab-reset 訊號機制', () => {
  it('發送重置訊號時，對應分頁的訂閱者會被呼叫', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeTabReset('scan', handler);

    emitTabReset('scan');
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('發送其他分頁的訊號時，不會呼叫無關的訂閱者', () => {
    const scanHandler = vi.fn();
    const queryHandler = vi.fn();
    const unsub1 = subscribeTabReset('scan', scanHandler);
    const unsub2 = subscribeTabReset('query', queryHandler);

    emitTabReset('query');
    expect(scanHandler).not.toHaveBeenCalled();
    expect(queryHandler).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it('取消訂閱後不再收到訊號', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeTabReset('settings', handler);
    unsubscribe();

    emitTabReset('settings');
    expect(handler).not.toHaveBeenCalled();
  });

  it('沒有訂閱者時發送訊號不會拋出錯誤', () => {
    expect(() => emitTabReset('nonexistent')).not.toThrow();
  });

  it('同一分頁多個訂閱者都會被呼叫', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const unsub1 = subscribeTabReset('single-scan', h1);
    const unsub2 = subscribeTabReset('single-scan', h2);

    emitTabReset('single-scan');
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });
});
