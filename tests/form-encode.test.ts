import { describe, it, expect } from 'vitest';

// 與 hooks/use-web-view.ts 中 toPlainValue 相同的邏輯（純函式抽驗）
const toPlainValue = (value: any): string => {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.length > 0 ? toPlainValue(value[0]) : '';
  }
  return String(value).replace(/[,\s]+$/, '');
};

const encodeForm = (params: Record<string, any>) =>
  Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(toPlainValue(value))}`)
    .join('&');

describe('表單參數編碼（usetype 不得帶逗號）', () => {
  it('純字串值原樣傳出', () => {
    expect(encodeForm({ usetype: 'A' })).toBe('usetype=A');
  });

  it('值尾端有逗號時應去除', () => {
    expect(encodeForm({ usetype: 'A,' })).toBe('usetype=A');
    expect(encodeForm({ usetype: 'B, ' })).toBe('usetype=B');
  });

  it('陣列值只取第一個元素（避免 join 成 "A,"）', () => {
    expect(encodeForm({ usetype: ['A', ''] })).toBe('usetype=A');
    expect(encodeForm({ usetype: ['C'] })).toBe('usetype=C');
    expect(encodeForm({ usetype: [] })).toBe('usetype=');
  });

  it('null / undefined 轉為空字串', () => {
    expect(encodeForm({ usetype: null })).toBe('usetype=');
    expect(encodeForm({ usetype: undefined })).toBe('usetype=');
  });

  it('多參數組合正確且值中間的逗號保留（如 scannedData）', () => {
    const body = encodeForm({ code: 'A01', scannedData: 'x1,x2,x3', usetype: 'B' });
    expect(body).toBe('code=A01&scannedData=x1%2Cx2%2Cx3&usetype=B');
  });
});
