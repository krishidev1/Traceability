import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecretKey, {
    algorithm: "HS256",
    expiresIn: `${config.jwtExpireMinutes}m`,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience
  });
}

export function signRefreshToken(userId, tokenId) {
  return jwt.sign({ sub: String(userId), typ: "refresh" }, config.jwtSecretKey, {
    algorithm: "HS256",
    expiresIn: `${config.refreshExpireDays}d`,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    jwtid: tokenId
  });
}

