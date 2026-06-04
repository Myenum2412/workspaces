// @ts-nocheck
import { Resend } from "resend";
import { signupWelcomeTemplate } from "./templates/signup-welcome.js";
import { inviteTemplate } from "./templates/invite.js";
import { forgotPasswordTemplate } from "./templates/forgot-password.js";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Email] RESEND_API_KEY not set — emails will be logged only");
    return null;
  }
  return new Resend(key);
}

const FROM_EMAIL = process.env.EMAIL_FROM as string;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string;

interface InviteEmailParams {
  to: string;
  inviteToken: string;
  organizationName: string;
  inviterName: string;
  role: string;
}

export async function sendInviteEmail(params: InviteEmailParams) {
  const { to, inviteToken, organizationName, inviterName, role } = params;
  const inviteUrl = `${APP_URL}/org-menu/invite?token=${inviteToken}`;
  const html = inviteTemplate({ inviterName, organizationName, role, inviteUrl });

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] INVITE → ${to} | org: ${organizationName} | role: ${role} | url: ${inviteUrl}`);
    return;
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been invited to join ${organizationName}`,
    html,
  });
}

interface SignupWelcomeEmailParams {
  to: string;
  name: string;
  password: string;
  verifyUrl: string;
}

export async function sendSignupWelcomeEmail(params: SignupWelcomeEmailParams) {
  const { to, name, password, verifyUrl } = params;
  const loginUrl = `${APP_URL}/login`;
  const html = signupWelcomeTemplate({ name, email: to, password, loginUrl, verifyUrl });

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] SIGNUP WELCOME → ${to} | name: ${name} | login: ${loginUrl}`);
    return;
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome — Your Account Details",
    html,
  });
}

interface ForgotPasswordEmailParams {
  to: string;
  otp: string;
  resetUrl: string;
}

export async function sendForgotPasswordEmail(params: ForgotPasswordEmailParams) {
  const { to, otp, resetUrl } = params;
  const html = forgotPasswordTemplate({ otp, resetUrl });

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] FORGOT PASSWORD → ${to} | reset: ${resetUrl}`);
    return;
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset Your Password",
    html,
  });
}

export async function sendVerificationEmail(params: ForgotPasswordEmailParams) {
  const { to, otp, resetUrl } = params;
  const html = forgotPasswordTemplate({ otp, resetUrl });

  const resend = getResend();
  if (!resend) {
    console.log(`[Email] EMAIL VERIFICATION → ${to} | reset: ${resetUrl}`);
    return;
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verification Mail",
    html,
  });
}
