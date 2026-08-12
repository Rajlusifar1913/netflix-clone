/**
 * StripePaymentModal.tsx
 *
 * PCI-DSS compliant payment form using Stripe.js Elements.
 * Card details are encrypted IN THE BROWSER by Stripe — they never touch our server.
 * Only a `paymentMethodId` token is sent to the backend.
 */

import { useState, useEffect } from "react";
import { X, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/api";

// ─── Stripe Initialization ────────────────────────────────────────────────────
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

const isRealPublishableKey = (key?: string): boolean =>
  !!key &&
  (key.startsWith("pk_test_") || key.startsWith("pk_live_")) &&
  !key.includes("replace") &&
  key.length > 20;

const stripePromise = isRealPublishableKey(STRIPE_PK) ? loadStripe(STRIPE_PK!) : null;

// ─── Shared Type ──────────────────────────────────────────────────────────────
export interface SubscriptionData {
  status: string;
  planId: string;
  planName: string;
  planSpecs: string;
  cardLast4: string;
  cardBrand: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ─── Stripe CardElement styling ───────────────────────────────────────────────
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      color: "#ffffff",
      fontFamily: "'Inter', 'system-ui', sans-serif",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#666" },
      iconColor: "#999",
    },
    invalid: {
      color: "#f87171",
      iconColor: "#f87171",
    },
  },
  hidePostalCode: true,
};

// ─── Inner Form (must be inside <Elements>) ───────────────────────────────────
function PaymentForm({
  onSuccess,
  onClose,
}: {
  onSuccess: (sub: SubscriptionData) => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentReady, setIntentReady] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  // Step 1: Get a SetupIntent client secret from the backend
  useEffect(() => {
    apiRequest<{ data: { clientSecret: string } }>("/payments/create-setup-intent", {
      method: "POST",
    })
      .then((res) => {
        setClientSecret(res.data.clientSecret);
      })
      .catch((err) => {
        setIntentError(
          err instanceof Error
            ? err.message
            : "Failed to initialize payment form. Please try again."
        );
      })
      .finally(() => setIntentReady(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements || !clientSecret) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setLoading(true);
    try {
      // Step 2: Tokenize card in the browser via Stripe.js
      // Card number, expiry, CVC are encrypted by Stripe — never touch our server
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setError(stripeError.message || "Card verification failed. Please check your details.");
        return;
      }

      const paymentMethodId = setupIntent?.payment_method as string;
      if (!paymentMethodId) {
        setError("Failed to process card. Please try again.");
        return;
      }

      // Step 3: Send only the opaque token to our server — no raw card data
      const res = await apiRequest<{ data: { subscription: SubscriptionData } }>(
        "/payments/update-payment",
        {
          method: "POST",
          body: JSON.stringify({ paymentMethodId }),
        }
      );

      if (res.data?.subscription) {
        onSuccess(res.data.subscription);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment method.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Intent or submit errors */}
      {(intentError || error) && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/60 p-3 text-xs text-red-200">
          {intentError || error}
        </div>
      )}

      {/* Stripe Card Element */}
      <div>
        <label className="block text-xs font-semibold text-[#ccc] mb-2">Card Details</label>
        {!intentReady ? (
          <div className="h-12 animate-pulse rounded-lg border border-white/20 bg-white/5" />
        ) : intentError ? null : (
          <div className="rounded-lg border border-white/20 bg-black/60 px-4 py-4 transition-colors focus-within:border-white/50">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-emerald-300/80">
          Your card is encrypted by <span className="font-semibold">Stripe</span> directly in your
          browser and never reaches our servers. We only store the last 4 digits for display.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/20 px-5 py-2 text-xs font-semibold text-[#ccc] transition-colors hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !intentReady || !!intentError || !stripe}
          className="flex items-center gap-1.5 rounded-lg bg-[#e50914] px-6 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#c80710] disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Lock className="size-3" />
              Save Card Securely
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
interface StripePaymentModalProps {
  onClose: () => void;
  onSuccess: (subscription: SubscriptionData) => void;
}

export function StripePaymentModal({ onClose, onSuccess }: StripePaymentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-900/40 p-2.5 text-emerald-400">
            <CreditCard className="size-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Update Payment Method</h3>
            <p className="text-xs text-[#aaa]">Secured by Stripe · PCI-DSS compliant</p>
          </div>
        </div>

        {/* Stripe Elements form or "not configured" warning */}
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/40 p-4">
              <p className="text-sm font-semibold text-amber-200">Payment processing not configured</p>
              <p className="mt-1 text-xs text-amber-300/70">
                Add your Stripe publishable key to{" "}
                <code className="rounded bg-black/40 px-1 py-0.5">client/.env</code>:
              </p>
              <code className="mt-2 block rounded bg-black/60 p-2 text-xs text-emerald-300">
                VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
              </code>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg border border-white/20 px-5 py-2 text-xs font-semibold text-[#ccc] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
