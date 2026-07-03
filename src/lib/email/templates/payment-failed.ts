export function paymentFailedEmail(input: { manageUrl: string }) {
  return {
    subject: "Your Recipe Vault payment failed",
    html: `
      <div style="font-family:Arial, sans-serif; line-height:1.6;">
        <h2>Payment failed</h2>
        <p>Please update your payment method to keep your plan active.</p>
        <p><a href="${input.manageUrl}">Manage billing</a></p>
      </div>
    `,
  };
}
