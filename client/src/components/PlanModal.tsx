import { useState } from "react";
import { Check, X, Zap } from "lucide-react";

export interface PlanOption {
  id: "mobile" | "standard" | "premium";
  name: string;
  price: string;
  quality: string;
  resolution: string;
  screens: string;
  isPopular?: boolean;
}

export const PLANS: PlanOption[] = [
  {
    id: "mobile",
    name: "Mobile",
    price: "$3.99 / mo",
    quality: "Fair",
    resolution: "480p SD",
    screens: "1 Screen at once",
  },
  {
    id: "standard",
    name: "Standard",
    price: "$9.99 / mo",
    quality: "Great",
    resolution: "1080p Full HD",
    screens: "2 Screens at once",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$15.99 / mo",
    quality: "Best",
    resolution: "4K + HDR Ultra HD",
    screens: "4 Screens at once",
    isPopular: true,
  },
];

interface PlanModalProps {
  currentPlanId: string;
  onClose: () => void;
  onSelectPlan: (planId: "mobile" | "standard" | "premium") => Promise<void>;
}

export function PlanModal({ currentPlanId, onClose, onSelectPlan }: PlanModalProps) {
  const [selected, setSelected] = useState<"mobile" | "standard" | "premium">(
    (currentPlanId as "mobile" | "standard" | "premium") || "premium"
  );
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onSelectPlan(selected);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#aaa] hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#e50914]/20 p-2 text-[#e50914]">
            <Zap className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Choose the plan that&apos;s right for you</h2>
            <p className="text-sm text-[#aaa]">Downgrade or upgrade at any time.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;
            const isCurrent = currentPlanId.toLowerCase() === plan.id || currentPlanId.toLowerCase() === plan.name.toLowerCase();

            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-5 transition-all ${
                  isSelected
                    ? "border-[#e50914] bg-[#221012] shadow-lg shadow-[#e50914]/10"
                    : "border-white/15 bg-[#121212] hover:border-white/40"
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#e50914] px-3 py-0.5 text-[10px] font-bold tracking-wider text-white">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {isSelected && (
                      <div className="grid size-5 place-items-center rounded-full bg-[#e50914] text-white">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xl font-black text-[#e50914]">{plan.price}</p>
                  <div className="mt-4 space-y-2 text-xs text-[#ccc]">
                    <p className="font-semibold text-white">{plan.quality} quality</p>
                    <p>{plan.resolution}</p>
                    <p>{plan.screens}</p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="mt-4 text-center text-[11px] font-semibold text-[#888]">
                    Current Plan
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/10 pt-5">
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-[#ccc] hover:border-white hover:text-white"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleConfirm}
            className="rounded-md bg-[#e50914] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c80710] disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
