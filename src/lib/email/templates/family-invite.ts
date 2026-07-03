export function familyInviteEmail(input: { inviteCode: string; inviteUrl: string }) {
  return {
    subject: "Join my Recipe Vault Family",
    html: `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>You are invited to a Recipe Vault Family</h2>
        <p>Use this invite code: <strong>${input.inviteCode}</strong></p>
        <p><a href="${input.inviteUrl}">Join the family</a></p>
      </div>
    `,
  };
}
