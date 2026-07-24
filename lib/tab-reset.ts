/**
 * 分頁重置訊號：當使用者「再次點擊」目前所在的分頁按鈕時，
 * Tab 佈局會發送該分頁名稱的重置訊號，各功能頁訂閱後將畫面重置回初始狀態。
 */
type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeTabReset(tabName: string, listener: Listener): () => void {
  let set = listeners.get(tabName);
  if (!set) {
    set = new Set();
    listeners.set(tabName, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function emitTabReset(tabName: string) {
  const set = listeners.get(tabName);
  if (set) {
    set.forEach((listener) => listener());
  }
}
