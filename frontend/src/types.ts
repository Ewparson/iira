export enum Rights {
  NODE_EXECUTE       = 1 << 0,
  WALLET_ISSUE       = 1 << 1,
  JOB_EXECUTE        = 1 << 2,
  SUBLICENSE_NODE    = 1 << 3,
  SUBLICENSE_WALLET  = 1 << 4,
  ADMIN              = 1 << 15,
}
export type AuthPayload = { token: string; rights: number; licenses: string[] };
