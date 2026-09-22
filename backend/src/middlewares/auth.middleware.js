import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

async function findUserFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findByPk(decoded.id);
}

export async function protect(req, res, next) {
  try {
    const user = await findUserFromHeader(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await findUserFromHeader(req);
  } catch (_error) {
    req.user = null;
  }
  next();
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
