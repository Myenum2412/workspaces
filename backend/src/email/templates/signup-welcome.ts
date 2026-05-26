interface SignupWelcomeTemplateProps {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  verifyUrl: string;
}

export function signupWelcomeTemplate({ name, email, password, loginUrl, verifyUrl }: SignupWelcomeTemplateProps) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #059669; color: white; font-size: 20px; font-weight: bold;">M</div>
      </div>
      <h1 style="font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 8px;">Welcome, ${name}!</h1>
      <p style="font-size: 15px; color: #64748b; text-align: center; margin-bottom: 24px;">
        Your account has been created successfully. Below are your login credentials.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;"><strong>Email:</strong> ${email}</p>
        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;"><strong>Verification Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Pending</span></p>
        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${password}</span></p>
      </div>
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="${verifyUrl}" style="display: inline-block; padding: 14px 36px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">Verify Email Address</a>
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${loginUrl}" style="color: #059669; text-decoration: underline; font-size: 14px;">Login to Your Account</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">
        For security reasons, we recommend changing your password after your first login.
      </p>
    </div>
  `;
}
