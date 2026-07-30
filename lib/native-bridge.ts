export type NativeBridgeAction =
  | 'camera'
  | 'scan'
  | 'gps'
  | 'signature'
  | 'record'
  | 'download'
  | 'version'
  | 'platform';

export interface NativeBridgeMessage {
  bridge: 'hojie';
  action: NativeBridgeAction;
  requestId?: string;
  payload?: Record<string, unknown>;
}

export interface NativeCameraResult {
  requestId?: string;
  base64: string;
  mimeType: string;
  fileName: string;
  width?: number;
  height?: number;
}

const escapeForInjectedJavaScript = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * 注入所有 WebView 頁面的 Bridge API。
 *
 * PHP / HTML 可使用：
 *   window.HoJieBridge.camera({ facing: 'back' });
 * 或相容別名：
 *   window.Bridge.camera();
 */
export const nativeBridgeBootstrapScript = `
(function () {
  if (window.HoJieBridge && window.HoJieBridge.__ready) {
    true;
    return;
  }

  function createRequestId() {
    return 'bridge-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function send(action, payload) {
    var requestId = createRequestId();

    if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) {
      return null;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      bridge: 'hojie',
      action: action,
      requestId: requestId,
      payload: payload || {}
    }));

    return requestId;
  }

  var bridge = {
    __ready: true,
    camera: function (options) { return send('camera', options); },
    scan: function (options) { return send('scan', options); },
    gps: function (options) { return send('gps', options); },
    signature: function (options) { return send('signature', options); },
    record: function (options) { return send('record', options); },
    download: function (options) { return send('download', options); },
    version: function () { return send('version'); },
    platform: function () { return send('platform'); },
    receive: function (eventName, detail) {
      window.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
    }
  };

  window.HoJieBridge = bridge;
  window.Bridge = bridge;
  window.dispatchEvent(new CustomEvent('hojie:bridge-ready'));
  true;
})();
`;

export const parseNativeBridgeMessage = (
  rawData: string
): NativeBridgeMessage | null => {
  try {
    const parsed = JSON.parse(rawData) as Partial<NativeBridgeMessage>;

    if (parsed.bridge !== 'hojie' || typeof parsed.action !== 'string') {
      return null;
    }

    return parsed as NativeBridgeMessage;
  } catch {
    return null;
  }
};

export const buildCameraResultScript = (result: NativeCameraResult): string => `
(function () {
  var bridge = window.HoJieBridge || window.Bridge;
  var detail = ${escapeForInjectedJavaScript(result)};

  if (bridge && typeof bridge.receive === 'function') {
    bridge.receive('hojie:camera-result', detail);
  } else {
    window.dispatchEvent(new CustomEvent('hojie:camera-result', { detail: detail }));
  }
  true;
})();
`;

export const buildBridgeInfoResultScript = (
  eventName: string,
  detail: Record<string, unknown>
): string => `
(function () {
  var bridge = window.HoJieBridge || window.Bridge;
  var detail = ${escapeForInjectedJavaScript(detail)};

  if (bridge && typeof bridge.receive === 'function') {
    bridge.receive(${escapeForInjectedJavaScript(eventName)}, detail);
  }
  true;
})();
`;
