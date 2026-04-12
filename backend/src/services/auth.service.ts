import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { ApiError } from "../utils/errors";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type KycInput = {
  panNumber: string;
  bankAccount: string;
  bankIfsc: string;
};

export class AuthService {
  public async register(input: RegisterInput) {
    const existing = await prisma.investor.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existing) {
      throw new ApiError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const investor = await prisma.investor.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        kycVerified: false
      }
    });

    return {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      kyc_verified: investor.kycVerified
    };
  }

  public async login(input: LoginInput) {
    const investor = await prisma.investor.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!investor) {
      throw new ApiError(401, "Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(input.password, investor.passwordHash);

    if (!passwordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        investorId: investor.id,
        email: investor.email,
        kycVerified: investor.kycVerified
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] }
    );

    return {
      token,
      investor: {
        id: investor.id,
        name: investor.name,
        kyc_verified: investor.kycVerified
      }
    };
  }

  public async verifyKyc(investorId: string, input: KycInput) {
    if (!input.panNumber || !input.bankAccount || !input.bankIfsc) {
      throw new ApiError(400, "KYC payload is incomplete");
    }

    await prisma.investor.update({
      where: { id: investorId },
      data: {
        kycVerified: true,
        linkedBank: input.bankAccount
      }
    });

    return {
      status: "VERIFIED",
      message: "KYC verification completed"
    };
  }
}
