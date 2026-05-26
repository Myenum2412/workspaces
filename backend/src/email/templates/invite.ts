interface InviteTemplateProps {
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}

export function inviteTemplate({ inviterName, organizationName, role, inviteUrl }: InviteTemplateProps) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: #059669; color: white; font-size: 20px; font-weight: bold;">M</div>
      </div>
      <h1 style="font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; margin-bottom: 8px;">You're invited!</h1>
      <p style="font-size: 15px; color: #64748b; text-align: center; margin-bottom: 24px;">
        <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 32px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Accept Invitation</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">
        This link expires in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
}
