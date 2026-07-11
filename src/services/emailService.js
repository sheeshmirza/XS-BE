const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: false,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      }
    });
  }

  async sendEmail({ to, subject, html }) {
    if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
      logger.warn('SMTP is not fully configured. Skipping email dispatch.');
      return;
    }

    await this.transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html
    });
  }

  async sendVerificationEmail(email, token) {
    const link = `${env.clientUrl}/verify-email?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      html: `<p>Welcome to XSocial.</p><p>Verify your account: <a href="${link}">${link}</a></p>`
    });
  }

  async sendResetPasswordEmail(email, token) {
    const link = `${env.clientUrl}/reset-password?token=${token}`;
    await this.sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `<p>Password reset requested.</p><p>Reset link: <a href="${link}">${link}</a></p>`
    });
  }
}

module.exports = new EmailService();
