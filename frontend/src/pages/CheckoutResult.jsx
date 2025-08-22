import { useLocation } from "react-router-dom";

export default function CheckoutResult() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const success = params.get("success") === "1";
  const canceled = params.get("canceled") === "1";

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      {success && <h2>✅ Payment complete</h2>}
      {canceled && <h2>❌ Payment canceled</h2>}
      {!success && !canceled && <h2>ℹ️ Payment status unknown</h2>}
      <p>You can close this tab or go back to the app.</p>
    </div>
  );
}
