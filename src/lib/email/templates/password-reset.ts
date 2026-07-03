export function passwordResetEmail(input: { resetUrl: string }) {
  return {
    subject: "Reset your Recipe Vault password",
    html: `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password.</p>
        <p><a href="${input.resetUrl}" style="display:inline-block;padding:12px 20px;background:#e26d5c;color:white;border-radius:999px;text-decoration:none;">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };
}
