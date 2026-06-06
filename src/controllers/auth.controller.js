import authService from '../services/auth.service.js';

const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

/**
 * Authentication Controller Layer
 * Handles HTTP requests and responses for auth endpoints
 */
class AuthController {
  /**
   * Register new user
   * @route POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { fullName, email, password, confirmPassword, phoneNumber, countryName, regionName, cityName } = req.body;

      // Validation
      if (!fullName || !email || !password || !confirmPassword || !countryName || !regionName || !cityName) {
        return res.status(400).json({
          success: false,
          error: 'Full name, email, password, confirm password, country, region and city are required'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Password match validation
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match'
        });
      }

      // Password strength validation (min 8 characters)
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
      }

      const result = await authService.register({
        fullName,
        email,
        password,
        phoneNumber,
        countryName,
        regionName,
        cityName
      });

      res.status(201).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @route POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register user with Firebase token
   * @route POST /api/auth/firebase-register
   */
  async firebaseRegister(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'idToken is required'
        });
      }

      const result = await authService.firebaseRegister(idToken);

      res.status(201).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user with Firebase token
   * @route POST /api/auth/firebase-login
   */
  async firebaseLogin(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'idToken is required'
        });
      }

      const result = await authService.firebaseLogin(idToken);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password - Send OTP
   * @route POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Validation
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP
   * @route POST /api/auth/verify-otp
   */
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Validation
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      const result = await authService.verifyOTP(email, otp);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify registration OTP
   * @route POST /api/auth/verify-registration-otp
   */
  async verifyRegistrationOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Validation
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      const result = await authService.verifyRegistrationOTP(email, otp);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend registration OTP
   * @route POST /api/auth/resend-registration-otp
   */
  async resendRegistrationOTP(req, res, next) {
    try {
      const { email } = req.body;

      // Validation
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await authService.resendRegistrationOTP(email);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with OTP
   * @route POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { email, otp, password, confirmPassword } = req.body;

      // Validation
      if (!email || !otp || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Email, OTP, password, and confirm password are required'
        });
      }

      // Password match validation
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match'
        });
      }

      // Password strength validation
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
      }

      const result = await authService.resetPassword(email, otp, password);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password (authenticated users)
   * @route POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.userId; // From auth middleware

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password, new password, and confirm password are required'
        });
      }

      // Password match validation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'New passwords do not match'
        });
      }

      // Password strength validation
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters long'
        });
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile (authenticated)
   * @route GET /api/auth/profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId; // From auth middleware

      const user = await authService.getProfile(userId, getBaseUrl(req));

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile (authenticated)
   * @route PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId; // From auth middleware
      const updateData = req.body;

      const user = await authService.updateProfile(userId, updateData, req.file, getBaseUrl(req));

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getAccountSettings(req, res, next) {
    return this.getProfile(req, res, next);
  }

  async updateAccountSettings(req, res, next) {
    return this.updateProfile(req, res, next);
  }

  async changeAccountPassword(req, res, next) {
    return this.changePassword(req, res, next);
  }
}

export default new AuthController();
