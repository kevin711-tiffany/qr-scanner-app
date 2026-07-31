import { gcm } from '@noble/ciphers/aes.js';
import { hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';

/**
 * PHP 端會執行 hash('sha256', $secretPassword, true)。
 * 此處直接保存相同密碼雜湊後的 32-byte AES 金鑰，避免在 App 程式碼中放入中文密碼明文。
 */
const QR_AES_KEY_HEX =
  '261c2f68ebe340c34676fffce5160e6f79ebc948b12b1217718277983efe266b';

const QR_AAD = utf8ToBytes('HEJIE-QR-V1');
const QR_VERSION = 'QR1';

const base64UrlToBytes = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const output: number[] = [];

  let buffer = 0;
  let bits = 0;

  for (const character of padded) {
    if (character === '=') break;
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('QR Code 的 Base64URL 格式錯誤');

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }

  return Uint8Array.from(output);
};

const concatBytes = (...arrays: Uint8Array[]): Uint8Array => {
  const result = new Uint8Array(arrays.reduce((total, item) => total + item.length, 0));
  let offset = 0;
  for (const item of arrays) {
    result.set(item, offset);
    offset += item.length;
  }
  return result;
};

const utf8FromBytes = (bytes: Uint8Array): string => {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  let encoded = '';
  for (const byte of bytes) encoded += `%${byte.toString(16).padStart(2, '0')}`;
  return decodeURIComponent(encoded);
};

/** 解密 PHP AES-256-GCM 產生的 QR1.IV.密文.TAG 字串。 */
export function decryptSettingsQr(encryptedText: string): string {
  const parts = encryptedText.trim().split('.');
  if (parts.length !== 4 || parts[0] !== QR_VERSION) {
    throw new Error('您讀取的 QR CODE 內容，不是我們要的格式哦。');
  }

  const iv = base64UrlToBytes(parts[1]);
  const ciphertext = base64UrlToBytes(parts[2]);
  const tag = base64UrlToBytes(parts[3]);

  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error('設定 QR Code 的加密格式錯誤');
  }

  try {
    const aes = gcm(hexToBytes(QR_AES_KEY_HEX), iv, QR_AAD);
    const plaintext = aes.decrypt(concatBytes(ciphertext, tag));
    return utf8FromBytes(plaintext);
  } catch {
    throw new Error('設定 QR Code 解密失敗');
  }
}
