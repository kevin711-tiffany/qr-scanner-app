import { describe, expect, it } from 'vitest';
import { buildFunctionMenuParams } from '@/services/function-menu-service';

describe('功能選單 usetype=E 參數', () => {
  it('只包含 Excel 規格欄位，sendUrl 不得列入 POST 參數', () => {
    const params = buildFunctionMenuParams({
      code: 'A01',
      sendUrl: 'https://example.com/menu.php',
      remark1: 'R1',
      remark2: 'R2',
      remark3: 'R3',
    });

    expect(params).toEqual({
      code: 'A01',
      remark1: 'R1',
      remark2: 'R2',
      remark3: 'R3',
      usetype: 'E',
    });
    expect(params).not.toHaveProperty('sendUrl');
  });
});
