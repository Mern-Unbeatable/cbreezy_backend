// import bcrypt from 'bcryptjs';
// import crypto from 'crypto';
// import prisma from '../config/prisma.js';
// import { verifyFirebaseIdToken } from '../config/firebase.js';
// import { generateToken } from '../utils/jwtUtils.js';
// import otpStore from '../utils/otpStore.js';
// import emailService from '../utils/emailService.js';
// import { createHttpError } from '../utils/httpError.js';

// const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

// const toPublicUploadPath = (filePath) => `/${filePath.split('uploads')[1].replace(/\\/g, '/').replace(/^\//, 'uploads/')}`;

// const toAbsoluteMediaUrl = (baseUrl, mediaPath) => {
//   if (!mediaPath) {
//     return mediaPath;
//   }

//   if (ABSOLUTE_URL_PATTERN.test(mediaPath)) {
//     return mediaPath;
//   }

//   const normalizedPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
//   return `${baseUrl}${normalizedPath}`;
// };

// const serializeUserProfile = (baseUrl, user) => {
//   if (!user) {
//     return user;
//   }

//   return {
//     ...user,
//     profileImage: toAbsoluteMediaUrl(baseUrl, user.profileImage),
//     countryName: user.country?.name || null,
//     regionName: user.region?.name || null,
//     cityName: user.city?.name || null,
//     locationName: user.city?.name || user.region?.name || null
//   };
// };

// /**
//  * Authentication Service Layer
//  * Handles business logic for authentication operations
//  */
// class AuthService {
//   async getVerifiedFirebaseUser(idToken) {
//     const decodedToken = await verifyFirebaseIdToken(idToken);
//     const email = decodedToken.email?.toLowerCase();

//     if (!email) {
//       throw new Error('Firebase token does not contain an email address');
//     }

//     if (!decodedToken.email_verified) {
//       throw new Error('Firebase email is not verified');
//     }

//     const fallbackName = email.split('@')[0] || 'User';

//     return {
//       email,
//       fullName: decodedToken.name?.trim() || fallbackName,
//       profileImage: decodedToken.picture || null
//     };
//   }

//   async createFirebaseUser({ email, fullName, profileImage }) {
//     const randomPassword = crypto.randomBytes(32).toString('hex');
//     const hashedPassword = await bcrypt.hash(randomPassword, 10);

//     return prisma.user.create({
//       data: {
//         fullName,
//         email,
//         password: hashedPassword,
//         profileImage,
//         role: 'USER',
//         isEmailVerified: true
//       }
//     });
//   }

//   async buildAuthResponse(user, message) {
//     // Re-fetch user with relations to ensure country/region/city are included
//     const fullUser = await prisma.user.findUnique({
//       where: { id: user.id },
//       select: {
//         id: true,
//         fullName: true,
//         email: true,
//         phoneNumber: true,
//         role: true,
//         profileImage: true,
//         isEmailVerified: true,
//         createdAt: true,
//         countryId: true,
//         regionId: true,
//         cityId: true,
//         country: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         region: {
//           select: {
//             id: true,
//             name: true,
//             countryId: true
//           }
//         },
//         city: {
//           select: {
//             id: true,
//             name: true,
//             regionId: true
//           }
//         }
//       }
//     });

//     if (!fullUser) {
//       throw new Error('User not found');
//     }

//     const token = generateToken({
//       userId: fullUser.id,
//       email: fullUser.email,
//       role: fullUser.role
//     });

//     return {
//       user: serializeUserProfile(null, fullUser),
//       token,
//       message
//     };
//   }

//   /**
//    * Register a new user
//    * @param {Object} userData - User registration data
//    * @returns {Promise<Object>} - Created user with token
//    */
//   async register(userData) {
//     const { fullName, email, password, phoneNumber, countryName, regionName, cityName } = userData;

//     // Check if user already exists
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         email: email.toLowerCase(),
//         deletedAt: null
//       }
//     });

//     if (existingUser) {
//       throw new Error('User with this email already exists');
//     }

//     // Resolve location IDs
//     let countryId = null;
//     let regionId = null;
//     let cityId = null;

//     const country = await prisma.country.findUnique({
//       where: { name: countryName }
//     });
//     if (!country) throw new Error(`Country '${countryName}' not found`);
//     countryId = country.id;

//     const region = await prisma.region.findFirst({
//       where: { name: regionName, countryId }
//     });
//     if (!region) throw new Error(`Region '${regionName}' not found in ${countryName}`);
//     regionId = region.id;

//     if (cityName) {
//       const normalizedCityName = cityName.trim();
//       const city = await prisma.city.findFirst({
//         where: { name: { equals: normalizedCityName, mode: 'insensitive' }, regionId }
//       });
//       if (!city) throw new Error(`City '${normalizedCityName}' not found in ${regionName}`);
//       cityId = city.id;
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user with email unverified
//     let user;
//     try {
//       user = await prisma.user.create({
//         data: {
//           fullName,
//           email: email.toLowerCase(),
//           password: hashedPassword,
//           phoneNumber: phoneNumber || null,
//           countryId,
//           regionId,
//           cityId,
//           role: 'USER',
//           isEmailVerified: false
//         },
//         select: {
//           id: true,
//           fullName: true,
//           email: true,
//           phoneNumber: true,
//           role: true,
//           profileImage: true,
//           isEmailVerified: true,
//           createdAt: true,
//           country: {
//             select: {
//               id: true,
//               name: true
//             }
//           },
//           region: {
//             select: {
//               id: true,
//               name: true,
//               countryId: true
//             }
//           },
//           city: {
//             select: {
//               id: true,
//               name: true,
//               regionId: true
//             }
//           }
//         }
//       });
//     } catch (err) {
//       // Prisma client/schema mismatch or validation issue — return a clear server error
//       if (err && err.name === 'PrismaClientValidationError') {
//         throw createHttpError(500, 'Server misconfiguration: Prisma client does not match schema. Run `npx prisma generate` and restart the server.');
//       }
//       throw err;
//     }

//     // Generate 5-digit OTP
//     const otp = Math.floor(10000 + Math.random() * 90000).toString();

//     // Store OTP (expires in 15 minutes)
//     const expiresInMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 15;
//     otpStore.store(email.toLowerCase(), otp, expiresInMinutes);

//     // Send OTP via email
//     const emailSent = await emailService.sendRegistrationOTP(email, otp, fullName);
    
//     // Log to console in development mode (for debugging)
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`\n📧 Registration OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)\n`);
//     }

//     return {
//       user: serializeUserProfile(null, user),
//       message: emailSent 
//         ? 'Registration successful. Please check your email for the verification code.'
//         : 'Registration successful. Please verify your email with the OTP. (Email service temporarily unavailable)'
//     };
//   }

//   /**
//    * Login user
//    * @param {string} email - User email
//    * @param {string} password - User password
//    * @returns {Promise<Object>} - User with token
//    */
//   async login(email, password) {
//     // Find user by email
//     const user = await prisma.user.findFirst({
//       where: {
//         email: email.toLowerCase(),
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       throw new Error('Invalid email or password');
//     }

//     // Verify password
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       throw new Error('Invalid email or password');
//     }

//     // Check if email is verified
//     if (!user.isEmailVerified) {
//       throw new Error('Please verify your email before logging in. Check your email for the OTP.');
//     }

//     // Return full auth response (includes relations)
//     return await this.buildAuthResponse(user, 'Login successful');
//   }

//   /**
//    * Login/Register user with Firebase authentication token
//    * @param {string} idToken - Firebase ID token from frontend
//    * @returns {Promise<Object>} - User with backend JWT token
//    */
//   async firebaseRegister(idToken) {
//     const { email, fullName, profileImage } = await this.getVerifiedFirebaseUser(idToken);

//     const existingUser = await prisma.user.findFirst({
//       where: {
//         email,
//         deletedAt: null
//       }
//     });

//     if (existingUser) {
//       throw new Error('User with this email already exists');
//     }

//     const user = await this.createFirebaseUser({ email, fullName, profileImage });

//     return this.buildAuthResponse(user, 'Firebase registration successful');
//   }

//   async firebaseLogin(idToken) {
//     const { email } = await this.getVerifiedFirebaseUser(idToken);

//     const user = await prisma.user.findFirst({
//       where: {
//         email,
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       throw new Error('No account found for this email. Please register first.');
//     }

//     return this.buildAuthResponse(user, 'Firebase login successful');
//   }

//   /**
//    * Send OTP for password reset
//    * @param {string} email - User email
//    * @returns {Promise<Object>} - Success message
//    */
//   async forgotPassword(email) {
//     // Check if user exists
//     const user = await prisma.user.findFirst({
//       where: {
//         email: email.toLowerCase(),
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       // Don't reveal if email exists or not (security best practice)
//       return {
//         message: 'If the email exists, a reset code has been sent'
//       };
//     }

//     // Generate 5-digit OTP
//     const otp = Math.floor(10000 + Math.random() * 90000).toString();

//     // Store OTP (expires in 15 minutes)
//     const expiresInMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 15;
//     otpStore.store(email.toLowerCase(), otp, expiresInMinutes);

//     // Send OTP via email
//     const emailSent = await emailService.sendPasswordResetOTP(email, otp);

//     // Log to console in development mode (for debugging)
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`\n📧 Password Reset OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)\n`);
//     }

//     return {
//       message: 'If the email exists, a reset code has been sent'
//     };
//   }

//   /**
//    * Verify OTP
//    * @param {string} email - User email
//    * @param {string} otp - OTP code
//    * @returns {Promise<Object>} - Verification result
//    */
//   async verifyOTP(email, otp) {
//     const isValid = otpStore.verify(email.toLowerCase(), otp);

//     if (!isValid) {
//       throw new Error('Invalid or expired OTP');
//     }

//     return {
//       message: 'OTP verified successfully',
//       email: email.toLowerCase()
//     };
//   }

//   /**
//    * Verify registration OTP and activate account
//    * @param {string} email - User email
//    * @param {string} otp - OTP code
//    * @returns {Promise<Object>} - User with token
//    */
//   async verifyRegistrationOTP(email, otp) {
//     // Verify OTP first
//     const isValid = otpStore.verify(email.toLowerCase(), otp);

//     if (!isValid) {
//       throw new Error('Invalid or expired OTP');
//     }

//     // Find user
//     const user = await prisma.user.findFirst({
//       where: {
//         email: email.toLowerCase(),
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Check if already verified
//     if (user.isEmailVerified) {
//       throw new Error('Email already verified');
//     }

//     // Update user to mark email as verified
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { isEmailVerified: true }
//     });

//     // Remove OTP after successful verification
//     otpStore.remove(email.toLowerCase());

//     // Generate JWT token
//     const token = generateToken({
//       userId: user.id,
//       email: user.email,
//       role: user.role
//     });

//     // Remove password from response
//     const { password: _, ...userWithoutPassword } = user;

//     return {
//       user: { ...userWithoutPassword, isEmailVerified: true },
//       token,
//       message: 'Email verified successfully. You can now log in.'
//     };
//   }

//   /**
//    * Resend registration OTP
//    * @param {string} email - User email
//    * @returns {Promise<Object>} - Success message
//    */
//   async resendRegistrationOTP(email) {
//     // Check if user exists and is not verified
//     const user = await prisma.user.findFirst({
//       where: {
//         email: email.toLowerCase(),
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     if (user.isEmailVerified) {
//       throw new Error('Email already verified');
//     }

//     // Generate 5-digit OTP
//     const otp = Math.floor(10000 + Math.random() * 90000).toString();

//     // Store OTP (expires in 15 minutes)
//     const expiresInMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 15;
//     otpStore.store(email.toLowerCase(), otp, expiresInMinutes);

//     // Send OTP via email
//     const emailSent = await emailService.sendRegistrationOTP(email, otp, user.fullName);

//     // Log to console in development mode (for debugging)
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`\n📧 Resend Registration OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)\n`);
//     }

//     return {
//       message: emailSent
//         ? 'OTP sent successfully. Please check your email.'
//         : 'OTP generated. (Email service temporarily unavailable)'
//     };
//   }

//   /**
//    * Reset password with OTP
//    * @param {string} email - User email
//    * @param {string} otp - OTP code
//    * @param {string} newPassword - New password
//    * @returns {Promise<Object>} - Success message
//    */
//   async resetPassword(email, otp, newPassword) {
//     // Verify OTP first
//     const isValid = otpStore.verify(email.toLowerCase(), otp);

//     if (!isValid) {
//       throw new Error('Invalid or expired OTP');
//     }

//     // Find user
//     const user = await prisma.user.findFirst({
//       where: {
//         email: email.toLowerCase(),
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { password: hashedPassword }
//     });

//     // Remove OTP after successful reset
//     otpStore.remove(email.toLowerCase());

//     return {
//       message: 'Password reset successful'
//     };
//   }

//   /**
//    * Change password (for logged-in users)
//    * @param {string} userId - User ID
//    * @param {string} currentPassword - Current password
//    * @param {string} newPassword - New password
//    * @returns {Promise<Object>} - Success message
//    */
//   async changePassword(userId, currentPassword, newPassword) {
//     // Find user
//     const user = await prisma.user.findFirst({
//       where: {
//         id: userId,
//         deletedAt: null
//       }
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Verify current password
//     const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

//     if (!isPasswordValid) {
//       throw new Error('Current password is incorrect');
//     }

//     // Check if new password is different from current
//     const isSamePassword = await bcrypt.compare(newPassword, user.password);
//     if (isSamePassword) {
//       throw new Error('New password must be different from current password');
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     await prisma.user.update({
//       where: { id: userId },
//       data: { password: hashedPassword }
//     });

//     return {
//       message: 'Password changed successfully'
//     };
//   }

//   /**
//    * Get user profile
//    * @param {string} userId - User ID
//    * @returns {Promise<Object>} - User profile
//    */
//   async getProfile(userId, baseUrl) {
//     const user = await prisma.user.findFirst({
//       where: {
//         id: userId,
//         deletedAt: null
//       },
//       select: {
//         id: true,
//         fullName: true,
//         email: true,
//         phoneNumber: true,
//         profileImage: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//         countryId: true,
//         regionId: true,
//         cityId: true,
//         country: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         region: {
//           select: {
//             id: true,
//             name: true,
//             countryId: true
//           }
//         }
//         ,
//         city: {
//           select: {
//             id: true,
//             name: true,
//             regionId: true
//           }
//         }
//       }
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     return serializeUserProfile(baseUrl, user);
//   }

//   /**
//    * Update user profile
//    * @param {string} userId - User ID
//    * @param {Object} updateData - Data to update
//    * @returns {Promise<Object>} - Updated user
//    */
//   async updateProfile(userId, updateData, file, baseUrl) {
//     const { fullName, phoneNumber, countryId, regionId } = updateData;

//     const existingUser = await prisma.user.findFirst({
//       where: {
//         id: userId,
//         deletedAt: null
//       },
//       select: {
//         id: true,
//         countryId: true,
//         regionId: true
//       }
//     });

//     if (!existingUser) {
//       throw new Error('User not found');
//     }

//     const normalizedFullName = fullName?.trim();
//     const normalizedPhoneNumber = phoneNumber === undefined ? undefined : (phoneNumber?.trim() || null);
//     const normalizedCountryId = countryId === undefined ? existingUser.countryId : (countryId || null);
//     const normalizedRegionId = regionId === undefined ? existingUser.regionId : (regionId || null);

//     if (fullName !== undefined && !normalizedFullName) {
//       throw new Error('Full name cannot be empty');
//     }

//     if ((regionId !== undefined || countryId !== undefined) && normalizedRegionId && !normalizedCountryId) {
//       throw new Error('countryId is required when regionId is provided');
//     }

//     if (normalizedCountryId) {
//       const country = await prisma.country.findUnique({
//         where: { id: normalizedCountryId }
//       });

//       if (!country) {
//         throw new Error('Invalid country');
//       }
//     }

//     if (normalizedRegionId) {
//       const region = await prisma.region.findFirst({
//         where: {
//           id: normalizedRegionId,
//           ...(normalizedCountryId ? { countryId: normalizedCountryId } : {})
//         }
//       });

//       if (!region) {
//         throw new Error('Invalid region for the selected country');
//       }
//     }

//     const user = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         ...(fullName !== undefined ? { fullName: normalizedFullName } : {}),
//         ...(phoneNumber !== undefined ? { phoneNumber: normalizedPhoneNumber } : {}),
//         ...(countryId !== undefined ? { countryId: normalizedCountryId } : {}),
//         ...(regionId !== undefined ? { regionId: normalizedRegionId } : {}),
//         ...(file ? { profileImage: getUploadedFileUrl(file) } : {})
//       },
//       select: {
//         id: true,
//         fullName: true,
//         email: true,
//         phoneNumber: true,
//         profileImage: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//         countryId: true,
//         regionId: true,
//         country: {
//           select: {
//             id: true,
//             name: true
//           }
//         },
//         region: {
//           select: {
//             id: true,
//             name: true,
//             countryId: true
//           }
//         }
//       }
//     });

//     return serializeUserProfile(baseUrl, user);
//   }
// }

// export default new AuthService();






import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { verifyFirebaseIdToken } from '../config/firebase.js';
import { generateToken } from '../utils/jwtUtils.js';
import otpStore from '../utils/otpStore.js';
import emailService from '../utils/emailService.js';
import { createHttpError } from '../utils/httpError.js';
import { getUploadedFileUrl, toAbsoluteMediaUrl } from '../utils/media.js';

const mapFirebaseSignInProvider = (signInProvider) => {
  if (signInProvider === 'google.com') {
    return 'GOOGLE';
  }

  return 'EMAIL';
};

const serializeUserProfile = (baseUrl, user) => {
  if (!user) {
    return user;
  }

  const authProvider = user.authProvider || 'EMAIL';
  const isGoogleLogin = authProvider === 'GOOGLE';

  return {
    ...user,
    authProvider,
    isGoogleLogin,
    canChangePassword: !isGoogleLogin,
    profileImage: toAbsoluteMediaUrl(baseUrl, user.profileImage),
    countryName: user.country?.name || null,
    regionName: user.region?.name || null,
    cityName: user.city?.name || null,
    locationName: user.city?.name || user.region?.name || null
  };
};

/**
 * Authentication Service Layer
 * Handles business logic for authentication operations
 */
class AuthService {
  async getVerifiedFirebaseUser(idToken) {
    const decodedToken = await verifyFirebaseIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();

    if (!email) {
      throw new Error('Firebase token does not contain an email address');
    }

    if (!decodedToken.email_verified) {
      throw new Error('Firebase email is not verified');
    }

    const fallbackName = email.split('@')[0] || 'User';

    return {
      email,
      fullName: decodedToken.name?.trim() || fallbackName,
      profileImage: decodedToken.picture || null,
      authProvider: mapFirebaseSignInProvider(decodedToken.firebase?.sign_in_provider)
    };
  }

  async createFirebaseUser({ email, fullName, profileImage, authProvider = 'EMAIL' }) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    return prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        profileImage,
        role: 'USER',
        authProvider,
        isEmailVerified: true
      }
    });
  }

  async ensureDefaultFreePlanExists() {
    const existingFreePlan = await prisma.pricingPlan.findFirst({
      where: { tier: 'FREE' }
    });

    if (!existingFreePlan) {
      await prisma.pricingPlan.create({
        data: {
          title: "Free Activation",
          price: 0,
          duration: 30,
          tier: "FREE",
          isActive: true
        }
      });
      console.log("Auto-generated default FREE pricing plan");
    }
  }

  async buildAuthResponse(user, message) {
    // Re-fetch user with relations to ensure country/region/city are included
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        authProvider: true,
        profileImage: true,
        isEmailVerified: true,
        createdAt: true,
        countryId: true,
        regionId: true,
        cityId: true,
        country: {
          select: {
            id: true,
            name: true
          }
        },
        region: {
          select: {
            id: true,
            name: true,
            countryId: true
          }
        },
        city: {
          select: {
            id: true,
            name: true,
            regionId: true
          }
        }
      }
    });

    if (!fullUser) {
      throw new Error('User not found');
    }

    const token = generateToken({
      userId: fullUser.id,
      email: fullUser.email,
      role: fullUser.role
    });

    return {
      user: serializeUserProfile(null, fullUser),
      token,
      message
    };
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user with token
   */
  async register(userData) {
    const { fullName, email, password, phoneNumber, countryName, regionName, cityName } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null
      }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Resolve location IDs
    let countryId = null;
    let regionId = null;
    let cityId = null;

    const country = await prisma.country.findUnique({
      where: { name: countryName }
    });
    if (!country) throw new Error(`Country '${countryName}' not found`);
    countryId = country.id;

    const region = await prisma.region.findFirst({
      where: { name: regionName, countryId }
    });
    if (!region) throw new Error(`Region '${regionName}' not found in ${countryName}`);
    regionId = region.id;

    if (cityName) {
      const normalizedCityName = cityName.trim();
      const city = await prisma.city.findFirst({
        where: { name: { equals: normalizedCityName, mode: 'insensitive' }, regionId }
      });
      if (!city) throw new Error(`City '${normalizedCityName}' not found in ${regionName}`);
      cityId = city.id;
    }

    // Ensure the default FREE pricing plan exists before creating a user
    await this.ensureDefaultFreePlanExists();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with email unverified
    let user;
    try {
      user = await prisma.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          password: hashedPassword,
          phoneNumber: phoneNumber || null,
          countryId,
          regionId,
          cityId,
          role: 'USER',
          authProvider: 'EMAIL',
          isEmailVerified: false
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          authProvider: true,
          profileImage: true,
          isEmailVerified: true,
          createdAt: true,
          country: {
            select: {
              id: true,
              name: true
            }
          },
          region: {
            select: {
              id: true,
              name: true,
              countryId: true
            }
          },
          city: {
            select: {
              id: true,
              name: true,
              regionId: true
            }
          }
        }
      });
    } catch (err) {
      // Prisma client/schema mismatch or validation issue — return a clear server error
      if (err && err.name === 'PrismaClientValidationError') {
        throw createHttpError(500, 'Server misconfiguration: Prisma client does not match schema. Run `npx prisma generate` and restart the server.');
      }
      throw err;
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Store OTP (expires in 15 minutes)
    const expiresInMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 15;
    otpStore.store(email.toLowerCase(), otp, expiresInMinutes);

    // Send OTP via email
    const emailSent = await emailService.sendRegistrationOTP(email, otp, fullName);
    
    // Log to console in development mode (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 Registration OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)\n`);
    }

    return {
      user: serializeUserProfile(null, user),
      message: emailSent 
        ? 'Registration successful. Please check your email for the verification code.'
        : 'Registration successful. Please verify your email with the OTP. (Email service temporarily unavailable)'
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User with token
   */
  async login(email, password) {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new Error('Please verify your email before logging in. Check your email for the OTP.');
    }

    // Return full auth response (includes relations)
    return await this.buildAuthResponse(user, 'Login successful');
  }

  /**
   * Login/Register user with Firebase authentication token
   * @param {string} idToken - Firebase ID token from frontend
   * @returns {Promise<Object>} - User with backend JWT token
   */
  async firebaseRegister(idToken) {
    const { email, fullName, profileImage, authProvider } = await this.getVerifiedFirebaseUser(idToken);

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null
      }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Ensure the default FREE pricing plan exists before creating a Firebase user
    await this.ensureDefaultFreePlanExists();

    const user = await this.createFirebaseUser({ email, fullName, profileImage, authProvider });

    return this.buildAuthResponse(user, 'Firebase registration successful');
  }

  async firebaseLogin(idToken) {
    const { email, authProvider } = await this.getVerifiedFirebaseUser(idToken);

    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('No account found for this email. Please register first.');
    }

    if (user.authProvider !== authProvider) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authProvider }
      });
    }

    return this.buildAuthResponse(user, 'Firebase login successful');
  }

  /**
   * Send OTP for password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Success message
   */
  async forgotPassword(email) {
    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null
      }
    });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return {
        message: 'If the email exists, a reset code has been sent'
      };
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Store OTP (expires in 15 minutes)
    const expiresInMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 15;
    otpStore.store(email.toLowerCase(), otp, expiresInMinutes);

    // Send OTP via email
    const emailSent = await emailService.sendPasswordResetOTP(email, otp);

    // Log to console in development mode (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 Password Reset OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)\n`);
    }

    return {
      message: 'If the email exists, a reset code has been sent'
    };
  }

  /**
   * Verify OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - Verification result
   */
  async verifyOTP(email, otp) {
    const isValid = otpStore.verify(email.toLowerCase(), otp);

    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    return {
      message: 'OTP verified successfully',
      email: email.toLowerCase()
    };
  }

  /**
   * Verify registration OTP and activate account
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - User with token
   */
  async verifyRegistrationOTP(email, otp) {
    // Verify OTP first
    const isValid = otpStore.verify(email.toLowerCase(), otp);

    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true }
    });

    // Remove OTP after successful verification
    otpStore.remove(email.toLowerCase());

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: { ...userWithoutPassword, isEmailVerified: true },
      token,
      message: 'Email verified successfully. You can now log in.'
    };
  }

  /**
   * Resend registration OTP
   * @param {string} email - User email
   * @returns {Promise<Object>} - Success message
   */
  async resendRegistrationOTP(email) {
    // Check if user exists and is not verified
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();

    // Store OTP (expires in 15 minutes)
    const expiresInMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 15;
    otpStore.store(email.toLowerCase(), otp, expiresInMinutes);

    // Send OTP via email
    const emailSent = await emailService.sendRegistrationOTP(email, otp, user.fullName);

    // Log to console in development mode (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 Resend Registration OTP for ${email}: ${otp} (expires in ${expiresInMinutes} minutes)\n`);
    }

    return {
      message: emailSent
        ? 'OTP sent successfully. Please check your email.'
        : 'OTP generated. (Email service temporarily unavailable)'
    };
  }

  /**
   * Reset password with OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Success message
   */
  async resetPassword(email, otp, newPassword) {
    // Verify OTP first
    const isValid = otpStore.verify(email.toLowerCase(), otp);

    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Remove OTP after successful reset
    otpStore.remove(email.toLowerCase());

    return {
      message: 'Password reset successful'
    };
  }

  /**
   * Change password (for logged-in users)
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.authProvider === 'GOOGLE') {
      throw new Error('Password change is not available for Google sign-in accounts');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return {
      message: 'Password changed successfully'
    };
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getProfile(userId, baseUrl) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        countryId: true,
        regionId: true,
        cityId: true,
        country: {
          select: {
            id: true,
            name: true
          }
        },
        region: {
          select: {
            id: true,
            name: true,
            countryId: true
          }
        }
        ,
        city: {
          select: {
            id: true,
            name: true,
            regionId: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return serializeUserProfile(baseUrl, user);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfile(userId, updateData, file, baseUrl) {
    const { fullName, phoneNumber, countryId, regionId } = updateData;

    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      },
      select: {
        id: true,
        countryId: true,
        regionId: true
      }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    const normalizedFullName = fullName?.trim();
    const normalizedPhoneNumber = phoneNumber === undefined ? undefined : (phoneNumber?.trim() || null);
    const normalizedCountryId = countryId === undefined ? existingUser.countryId : (countryId || null);
    const normalizedRegionId = regionId === undefined ? existingUser.regionId : (regionId || null);

    if (fullName !== undefined && !normalizedFullName) {
      throw new Error('Full name cannot be empty');
    }

    if ((regionId !== undefined || countryId !== undefined) && normalizedRegionId && !normalizedCountryId) {
      throw new Error('countryId is required when regionId is provided');
    }

    if (normalizedCountryId) {
      const country = await prisma.country.findUnique({
        where: { id: normalizedCountryId }
      });

      if (!country) {
        throw new Error('Invalid country');
      }
    }

    if (normalizedRegionId) {
      const region = await prisma.region.findFirst({
        where: {
          id: normalizedRegionId,
          ...(normalizedCountryId ? { countryId: normalizedCountryId } : {})
        }
      });

      if (!region) {
        throw new Error('Invalid region for the selected country');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName: normalizedFullName } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber: normalizedPhoneNumber } : {}),
        ...(countryId !== undefined ? { countryId: normalizedCountryId } : {}),
        ...(regionId !== undefined ? { regionId: normalizedRegionId } : {}),
        ...(file ? { profileImage: getUploadedFileUrl(file) } : {})
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        countryId: true,
        regionId: true,
        country: {
          select: {
            id: true,
            name: true
          }
        },
        region: {
          select: {
            id: true,
            name: true,
            countryId: true
          }
        }
      }
    });

    return serializeUserProfile(baseUrl, user);
  }
}

export default new AuthService();