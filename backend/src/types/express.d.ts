declare namespace Express {
  export interface Request {
    user?: {
      investorId: string;
      email: string;
      kycVerified: boolean;
    };
    idempotencyKey?: string;
    idempotencyRedisKey?: string;
  }
}
