interface ForgotPasswordTemplateProps {
  otp: string;
  resetUrl: string;
}

export function forgotPasswordTemplate({ otp, resetUrl }: ForgotPasswordTemplateProps) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #059669; color: white; font-size: 20px; font-weight: bold;">M</div>
      </div>
      <h1 style="font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 8px;">Reset Your Password</h1>
      <p style="font-size: 15px; color: #64748b; text-align: center; margin-bottom: 24px;">
        We received a request to reset your password. Use the OTP below and click the button to proceed.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;">Your One-Time Password</p>
        <p style="font-size: 32px; font-weight: 700; color: #059669; letter-spacing: 8px; font-family: monospace; margin: 0;">${otp}</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">This OTP is valid for 15 minutes</p>
      </div>
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 36px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;
}
