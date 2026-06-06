import nodemailer from 'nodemailer';

/**
 * Email Service for sending OTP and other emails
 * Uses Gmail SMTP with app password
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter with Gmail SMTP
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error.message);
        } else {
          console.log('✅ Email service is ready to send emails');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Send registration OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} fullName - User's full name
   * @returns {Promise<boolean>} - Success status
   */
  async sendRegistrationOTP(email, otp, fullName = 'User') {
    try {
      const mailOptions = {
        from: `"SideGurus" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Verify Your Email - SideGurus',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .otp-box { background-color: #fff; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to SideGurus!</h1>
              </div>
              <div class="content">
                <h2>Hello ${fullName},</h2>
                <p>Thank you for registering with SideGurus. To complete your registration, please verify your email address using the OTP code below:</p>
                
                <div class="otp-box">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
                  <div class="otp-code">${otp}</div>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code expires in 15 minutes</p>
                </div>
                
                <p>Enter this code in the verification page to activate your account.</p>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> If you didn't request this code, please ignore this email. Never share this code with anyone.
                </div>
                
                <p>Best regards,<br>The SideGurus Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2026 SideGurus. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Hello ${fullName},

Thank you for registering with SideGurus!

Your verification code is: ${otp}

This code expires in 15 minutes. Please enter it in the verification page to activate your account.

If you didn't request this code, please ignore this email.

Best regards,
The SideGurus Team
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Registration OTP email sent to ${email} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send registration OTP email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Send password reset OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @returns {Promise<boolean>} - Success status
   */
  async sendPasswordResetOTP(email, otp) {
    try {
      const mailOptions = {
        from: `"SideGurus" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset Code - SideGurus',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #ff5722; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .otp-box { background-color: #fff; border: 2px dashed #ff5722; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #ff5722; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .warning { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 10px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                
                <div class="otp-box">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your Reset Code</p>
                  <div class="otp-code">${otp}</div>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code expires in 15 minutes</p>
                </div>
                
                <p>Enter this code to reset your password.</p>
                
                <div class="warning">
                  <strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
                </div>
                
                <p>Best regards,<br>The SideGurus Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
                <p>&copy; 2026 SideGurus. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Password Reset Request

We received a request to reset your password.

Your reset code is: ${otp}

This code expires in 15 minutes. Please enter it to reset your password.

If you didn't request a password reset, please ignore this email.

Best regards,
The SideGurus Team
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset OTP email sent to ${email} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send password reset OTP email to ${email}:`, error.message);
      return false;
    }
  }

  async sendContactMessage({ toEmail, senderName, senderEmail, message }) {
    try {
      const mailOptions = {
        from: `"SideGurus Contact Form" <${process.env.EMAIL_FROM}>`,
        to: toEmail,
        replyTo: senderEmail,
        subject: `New Contact Message from ${senderName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 640px; margin: 0 auto; padding: 24px; }
              .header { background-color: #0d5c59; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f8f8f8; padding: 24px; border-radius: 0 0 8px 8px; }
              .meta { background: white; border: 1px solid #e6e6e6; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
              .message-box { background: white; border-left: 4px solid #f58220; padding: 16px; white-space: pre-wrap; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">New Contact Us Message</h2>
              </div>
              <div class="content">
                <div class="meta">
                  <p><strong>Name:</strong> ${senderName}</p>
                  <p><strong>Email:</strong> ${senderEmail}</p>
                </div>
                <div class="message-box">${message}</div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `New Contact Us Message\n\nName: ${senderName}\nEmail: ${senderEmail}\n\nMessage:\n${message}`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Contact message email sent to ${toEmail} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send contact message email to ${toEmail}:`, error.message);
      return false;
    }
  }
}

export default new EmailService();
