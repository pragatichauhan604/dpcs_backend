import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is required");
}

export type JwtUser = {
  id: string;
  role: string;
  email: string;
};

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (payload: JwtUser, remember = false) => {
  const expiresIn = remember
    ? process.env.JWT_REMEMBER_EXPIRES_IN || "7d"
    : process.env.JWT_EXPIRES_IN || "24h";

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string) => jwt.verify(token, secret) as JwtUser;
