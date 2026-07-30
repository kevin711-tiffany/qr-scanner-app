/**
 * Android WebView 在部分品牌手機上，遇到
 * <input type="file" accept="image/*" capture="environment">
 * 會直接嘗試啟動指定相機，但相機 Activity 無法正確回傳結果，
 * 造成點擊後沒有反應。
 *
 * 移除 capture 屬性後，Android 會改由系統檔案選擇器處理，
 * 使用者仍可選擇「相機」拍照，同時也保留相簿選擇功能，
 * 相容性會比強制指定 environment 相機更好。
 *
 * MutationObserver 會處理 AJAX 後才加入頁面的 file input。
 */
export const ANDROID_FILE_UPLOAD_COMPATIBILITY_SCRIPT = `
(function () {
  function normalizeFileInputs(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var inputs = scope.querySelectorAll('input[type="file"]');

    for (var i = 0; i < inputs.length; i += 1) {
      var input = inputs[i];

      if (input.hasAttribute('capture')) {
        input.setAttribute(
          'data-original-capture',
          input.getAttribute('capture') || ''
        );
        input.removeAttribute('capture');
      }

      if (!input.getAttribute('accept')) {
        input.setAttribute('accept', 'image/*');
      }
    }
  }

  function start() {
    normalizeFileInputs(document);

    if (!document.documentElement || !window.MutationObserver) {
      return;
    }

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i += 1) {
        var addedNodes = mutations[i].addedNodes;

        for (var j = 0; j < addedNodes.length; j += 1) {
          var node = addedNodes[j];

          if (node && node.nodeType === 1) {
            if (
              node.matches &&
              node.matches('input[type="file"]')
            ) {
              normalizeFileInputs(node.parentNode || document);
            } else {
              normalizeFileInputs(node);
            }
          }
        }
      }
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
})();
true;
`;
