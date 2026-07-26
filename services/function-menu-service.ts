import { postFormForHtml } from '@/services/api-service';
import type { FunctionMenuApiParams } from '@/types/api';
import type { BasicSettings } from '@/types/settings';

export const buildFunctionMenuParams = (settings: BasicSettings): FunctionMenuApiParams => ({
  code: settings.code,
  remark1: settings.remark1,
  remark2: settings.remark2,
  remark3: settings.remark3,
  usetype: 'E',
});

export const fetchFunctionMenuHtml = (settings: BasicSettings): Promise<string> =>
  postFormForHtml(settings.sendUrl, buildFunctionMenuParams(settings));
