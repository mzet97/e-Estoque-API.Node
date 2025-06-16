import { NextFunction, Request, Response } from 'express';
import { Secret, verify } from 'jsonwebtoken';
import authConfig from '@config/auth';

type JwtPayloadProps = {
  sub: string;
};

export const isAuthenticated = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    response.status(401).json({
      error: true,
      code: 'token.invalid',
      message: 'Access token not present',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    response.status(401).json({
      error: true,
      code: 'token.invalid',
      message: 'Access token not present',
    });
    return;
  }

  try {
    const decodedToken = verify(token, authConfig.jwt.secret as Secret);
    const { sub } = decodedToken as JwtPayloadProps;
    request.user = { id: sub };
    next();
  } catch {
    response.status(401).json({
      error: true,
      code: 'token.expired',
      message: 'Access token expired',
    });
  }
};
