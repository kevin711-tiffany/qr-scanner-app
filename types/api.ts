export interface BaseApiParams {
  code: string;
  remark1: string;
  remark2: string;
  remark3: string;
}

export interface FunctionMenuApiParams
  extends BaseApiParams {
  usetype: 'E';
}