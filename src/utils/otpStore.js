/**
 * In-memory OTP store (for development)
 * In production, use Redis or database
 */
class OTPStore {
  constructor() {
    this.otps = new Map();
  }

  /**
   * Store OTP for email with expiry
   * @param {string} email - User email
   * @param {string} otp - Generated OTP
   * @param {number} expiresInMinutes - Expiry time in minutes
   */
  store(email, otp, expiresInMinutes = 15) {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    this.otps.set(email.toLowerCase(), { otp, expiresAt });
    
    // Auto-cleanup after expiry
    setTimeout(() => {
      this.otps.delete(email.toLowerCase());
    }, expiresInMinutes * 60 * 1000);
  }

  /**
   * Verify OTP for email
   * @param {string} email - User email
   * @param {string} otp - OTP to verify
   * @returns {boolean} - True if valid, false otherwise
   */
  verify(email, otp) {
    const stored = this.otps.get(email.toLowerCase());
    
    if (!stored) {
      return false;
    }
    
    if (Date.now() > stored.expiresAt) {
      this.otps.delete(email.toLowerCase());
      return false;
    }
    
    return stored.otp === otp;
  }

  /**
   * Remove OTP after successful verification
   * @param {string} email - User email
   */
  remove(email) {
    this.otps.delete(email.toLowerCase());
  }

  /**
   * Get stored OTP (for debugging only)
   * @param {string} email - User email
   * @returns {string|null} - OTP or null
   */
  get(email) {
    const stored = this.otps.get(email.toLowerCase());
    if (!stored || Date.now() > stored.expiresAt) {
      return null;
    }
    return stored.otp;
  }
}

export default new OTPStore();
