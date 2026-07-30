import { Platform } from 'react-native';

/**
 * Android WebView 對 <input type="file" capture="environment"> 的處理，
 * 在部分品牌／Android 版本會無法開啟相機。
 *
 * Android 端移除 capture 屬性，交由系統檔案選擇器提供「相機／相簿」選項，
 * 可提高不同裝置的相容性；iOS 保留原始 capture 行為。
 */
const ANDROID_FILE_INPUT_COMPATIBILITY_SCRIPT = `
(function () {
  function normalizeFileInput(input) {
    if (!input || input.tagName !== 'INPUT' || input.type !== 'file') {
      return;
    }

    if (input.hasAttribute('capture')) {
      input.removeAttribute('capture');
    }

    if (!input.getAttribute('accept')) {
      input.setAttribute('accept', 'image/*');
    }
  }

  function normalizeAllFileInputs(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }

    root.querySelectorAll('input[type="file"]').forEach(normalizeFileInput);
  }

  function start() {
    normalizeAllFileInputs(document);

    if (!document.documentElement || typeof MutationObserver === 'undefined') {
      return;
    }

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (!node || node.nodeType !== 1) {
            return;
          }

          normalizeFileInput(node);
          normalizeAllFileInputs(node);
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  true;
})();
`;

export const webViewFileUploadCompatibilityScript =
  Platform.OS === 'android' ? ANDROID_FILE_INPUT_COMPATIBILITY_SCRIPT : undefined;
