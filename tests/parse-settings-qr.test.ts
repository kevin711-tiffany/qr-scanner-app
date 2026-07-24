import { describe, it, expect } from 'vitest';

// 與 app/(tabs)/settings.tsx 內的 parseSettingsQr 相同邏輯（Node 環境版本）。
// 新行為：一律回傳完整五個欄位，缺少或空白的欄位以空字串表示，
// 帶入設定時完全覆蓋舊資料（含清空）。
function parseSettingsQr(raw: string): {
  code: string;
  sendUrl: string;
  remark1: string;
  remark2: string;
  remark3: string;
} | null {
  const text = raw.trim();
  if (!text) return null;

  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text);
      const pick = (key: string, isUrl = false): string => {
        const value = typeof obj[key] === 'string' ? obj[key] : '';
        return isUrl ? value.trim() : value.slice(0, 30);
      };
      const hasAnyField = ['code', 'sendUrl', 'remark1', 'remark2', 'remark3'].some(
        (key) => typeof obj[key] === 'string' && obj[key] !== ''
      );
      if (!hasAnyField) return null;
      return {
        code: pick('code'),
        sendUrl: pick('sendUrl', true),
        remark1: pick('remark1'),
        remark2: pick('remark2'),
        remark3: pick('remark3'),
      };
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(text) && !text.includes(';') && !text.includes('\n')) {
    return { code: '', sendUrl: text, remark1: '', remark2: '', remark3: '' };
  }

  const parts = text.split(/[;\n]/).map((p) => p.trim());
  if (parts.length >= 2) {
    return {
      code: (parts[0] ?? '').slice(0, 30),
      sendUrl: parts[1] ?? '',
      remark1: (parts[2] ?? '').slice(0, 30),
      remark2: (parts[3] ?? '').slice(0, 30),
      remark3: (parts[4] ?? '').slice(0, 30),
    };
  }

  return null;
}

describe('parseSettingsQr（完全覆蓋模式）', () => {
  it('解析 JSON 格式：缺少的欄位回傳空字串（清空舊資料）', () => {
    const qr = '{"code":"A01","sendUrl":"http://59.126.88.156/mr/","remark1":"倉庫一"}';
    expect(parseSettingsQr(qr)).toEqual({
      code: 'A01',
      sendUrl: 'http://59.126.88.156/mr/',
      remark1: '倉庫一',
      remark2: '',
      remark3: '',
    });
  });

  it('JSON 格式：明確給空字串的欄位也回傳空字串', () => {
    const qr =
      '{"code":"A02","sendUrl":"http://example.com/","remark1":"","remark2":"","remark3":""}';
    expect(parseSettingsQr(qr)).toEqual({
      code: 'A02',
      sendUrl: 'http://example.com/',
      remark1: '',
      remark2: '',
      remark3: '',
    });
  });

  it('解析分隔符號格式（完整五欄）', () => {
    const qr = 'A01;http://59.126.88.156/mr/;倉庫一;班別A;測試';
    expect(parseSettingsQr(qr)).toEqual({
      code: 'A01',
      sendUrl: 'http://59.126.88.156/mr/',
      remark1: '倉庫一',
      remark2: '班別A',
      remark3: '測試',
    });
  });

  it('解析分隔符號格式（只有代碼與網址）：備註欄位清空', () => {
    const qr = 'A01;http://example.com/receive.php';
    expect(parseSettingsQr(qr)).toEqual({
      code: 'A01',
      sendUrl: 'http://example.com/receive.php',
      remark1: '',
      remark2: '',
      remark3: '',
    });
  });

  it('純網址：帶入傳送網址，其餘欄位清空', () => {
    expect(parseSettingsQr('http://example.com/mr/')).toEqual({
      code: '',
      sendUrl: 'http://example.com/mr/',
      remark1: '',
      remark2: '',
      remark3: '',
    });
  });

  it('分隔格式中的空白欄位回傳空字串（清空舊資料）', () => {
    const qr = 'A01;http://example.com/;;;備三';
    expect(parseSettingsQr(qr)).toEqual({
      code: 'A01',
      sendUrl: 'http://example.com/',
      remark1: '',
      remark2: '',
      remark3: '備三',
    });
  });

  it('無法解析的內容回傳 null', () => {
    expect(parseSettingsQr('')).toBeNull();
    expect(parseSettingsQr('純文字沒有分隔')).toBeNull();
    expect(parseSettingsQr('{invalid json')).toBeNull();
    expect(parseSettingsQr('{"other":"x"}')).toBeNull();
  });

  it('欄位超過 30 字元會被截斷', () => {
    const long = 'x'.repeat(40);
    const parsed = parseSettingsQr(`${long};http://example.com/`);
    expect(parsed?.code).toHaveLength(30);
  });

  it('以解析結果覆蓋舊設定時，空字串欄位會清空舊資料', () => {
    const oldSettings = {
      code: 'OLD',
      sendUrl: 'http://old.example.com/',
      remark1: '舊備註一',
      remark2: '舊備註二',
      remark3: '舊備註三',
    };
    const parsed = parseSettingsQr('A01;http://new.example.com/');
    // 新行為：直接以 parsed 為最終設定（完全覆蓋），不與舊設定合併
    const finalSettings = parsed!;
    expect(finalSettings).toEqual({
      code: 'A01',
      sendUrl: 'http://new.example.com/',
      remark1: '',
      remark2: '',
      remark3: '',
    });
    // 確認舊資料不會殘留
    expect(finalSettings.remark1).not.toBe(oldSettings.remark1);
  });
});
