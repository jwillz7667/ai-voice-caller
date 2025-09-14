import * as nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create nodemailer transporter for development
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
    // In production, we'll use SendGrid directly
    return null;
  }

  // For development, use nodemailer with SMTP
  if (!nodemailer.createTransporter) {
    console.warn('Nodemailer not properly imported, email sending disabled in development');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const transporter = createTransporter();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, text } = options;
  const from = process.env.EMAIL_FROM || 'noreply@verbio.ai';

  try {
    if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
      // Use SendGrid in production
      await sgMail.send({
        to,
        from,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
    } else if (transporter) {
      // Use nodemailer for development
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
    } else {
      // Log email in development if no email service is configured
      console.log('📧 Email would be sent:', { to, subject });
      console.log('Content:', html);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Verbio AI!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
            <center>
              <a href="${verifyUrl}" class="button">Verify Email</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>&copy; 2024 Verbio AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify your Verbio AI account',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request this password reset, please ignore this email.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Verbio AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset your Verbio AI password',
    html,
  });
}

export async function send2FACode(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Two-Factor Authentication</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Enter this code to complete your login:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p><strong>If you didn't request this code, someone might be trying to access your account. Please secure your account immediately.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Verbio AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Your Verbio AI verification code',
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { padding: 15px; margin: 10px 0; background: white; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Verbio AI!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your account has been successfully created! You're now ready to experience the power of AI-driven voice calls.</p>

            <h3>What you can do now:</h3>
            <div class="feature">
              <strong>🚀 Make Your First Call</strong>
              <p>Start with 100 free credits to test our AI voice calling system.</p>
            </div>
            <div class="feature">
              <strong>🎛️ Configure Your AI Assistant</strong>
              <p>Customize voice, personality, and behavior to match your needs.</p>
            </div>
            <div class="feature">
              <strong>📊 Track Performance</strong>
              <p>Monitor call metrics, transcripts, and analytics in real-time.</p>
            </div>

            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
            </center>

            <p>Need help? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/docs">documentation</a> or contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Verbio AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Verbio AI - Get Started!',
    html,
  });
}