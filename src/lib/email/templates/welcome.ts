export function welcomeEmail(input: { name?: string | null }) {
  return {
    subject: "Welcome to Recipe Vault",
    html: `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>Welcome to Recipe Vault${input.name ? `, ${input.name}` : ""}!</h2>
        <p>Your trial is live. Start scanning your favorite recipes.</p>
      </div>
    `,
  };
}
