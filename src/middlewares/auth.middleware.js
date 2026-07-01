import { verifyToken } from '../utils/jwtUtils.js';
import { LISTING_MODERATOR_ROLES, ROLES } from '../constants/roles.js';
import prisma from '../config/prisma.js';

export { ROLES, LISTING_MODERATOR_ROLES };

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please login to access this resource.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (decoded.role === ROLES.SUB_ADMIN) {
      const subAdmin = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          deletedAt: null,
          role: ROLES.SUB_ADMIN
        },
        select: {
          isActive: true
        }
      });

      if (!subAdmin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token. Please login again.'
        });
      }

      if (!subAdmin.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Your sub-admin account has been paused. Contact an administrator.'
        });
      }
    }

    // Attach user data to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please login again.'
    });
  }
};

/**
 * Authorization middleware - Check user roles
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};
