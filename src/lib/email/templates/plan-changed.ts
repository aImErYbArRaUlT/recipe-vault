export function planChangedEmail(input: { planName: string }) {
  return {
    subject: "Your Recipe Vault plan was updated",
    html: `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>Plan updated</h2>
        <p>Your subscription is now on the ${input.planName} plan.</p>
      </div>
    `,
  };
}
