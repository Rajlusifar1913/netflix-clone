import { apiRequest } from "./api";

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  price: string;
  monthlyAmount: number;
  durationDays: number;
  durationLabel: string;
  specs: string;
  quality: string;
  resolution: string;
  screens: string;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
  isCustom?: boolean;
  createdAt?: string;
}

const PLANS_STORAGE_KEY = "streamly_subscription_plans";

export const DEFAULT_PLANS: SubscriptionPlanItem[] = [
  {
    id: "mobile",
    name: "Mobile",
    price: "₹149 / mo",
    monthlyAmount: 149,
    durationDays: 30,
    durationLabel: "1 Month (30 Days)",
    specs: "720p HD (1 Screen on Mobile/Tablet)",
    quality: "Fair",
    resolution: "480p/720p SD",
    screens: "1 Screen at once",
    features: [
      "Phone & Tablet only",
      "Standard Definition 480p/720p",
      "1 Download Device",
      "Ad-Free Streaming",
    ],
    isActive: true,
  },
  {
    id: "standard",
    name: "Standard",
    price: "₹499 / mo",
    monthlyAmount: 499,
    durationDays: 30,
    durationLabel: "1 Month (30 Days)",
    specs: "Full HD 1080p (2 Screens at once)",
    quality: "Great",
    resolution: "1080p Full HD",
    screens: "2 Screens at once",
    features: [
      "TV, Computer, Phone, Tablet",
      "1080p Full HD Video Quality",
      "2 Download Devices",
      "Unlimited Movies & TV Shows",
    ],
    isActive: true,
  },
  {
    id: "premium",
    name: "Premium Ultra",
    price: "₹649 / mo",
    monthlyAmount: 649,
    durationDays: 30,
    durationLabel: "1 Month (30 Days)",
    specs: "Ultra HD 4K + HDR (4 Screens at once)",
    quality: "Best",
    resolution: "4K + HDR Ultra HD",
    screens: "4 Screens at once",
    features: [
      "TV, Computer, Phone, Tablet",
      "4K Ultra HD + Dolby Vision & HDR10",
      "Spatial Audio Sound Stage",
      "6 Download Devices",
      "4 Screens Watching at Once",
    ],
    isPopular: true,
    isActive: true,
  },
];

/**
 * Fetch all plans from localStorage with fallback to default plans
 */
export function getAllPlans(): SubscriptionPlanItem[] {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(DEFAULT_PLANS));
      return DEFAULT_PLANS;
    }
    return JSON.parse(raw) as SubscriptionPlanItem[];
  } catch {
    return DEFAULT_PLANS;
  }
}

/**
 * Fetch only active plans for user checkout & display
 */
export function getActivePlans(): SubscriptionPlanItem[] {
  const all = getAllPlans();
  const active = all.filter((p) => p.isActive);
  return active.length > 0 ? active : DEFAULT_PLANS;
}

/**
 * Find plan by ID or name
 */
export function getPlanById(id: string): SubscriptionPlanItem | undefined {
  const all = getAllPlans();
  const lower = id.toLowerCase();
  return (
    all.find((p) => p.id.toLowerCase() === lower) ||
    all.find((p) => p.name.toLowerCase() === lower) ||
    all.find((p) => p.id === "premium") ||
    DEFAULT_PLANS[2]
  );
}

function savePlans(plans: SubscriptionPlanItem[]): void {
  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  window.dispatchEvent(new CustomEvent("streamly:plans-change", { detail: plans }));
}

/**
 * Fetch active subscription plans from backend API
 */
export async function fetchServerPlans(): Promise<SubscriptionPlanItem[]> {
  try {
    const res = await apiRequest<{ data: SubscriptionPlanItem[] }>("/admin/plans");
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const formatted = res.data.map((p) => ({
        ...p,
        id: p.id || (p as unknown as { planId?: string }).planId || "plan",
      }));
      savePlans(formatted);
      return formatted;
    }
  } catch {
    // Fall back to local storage
  }
  return getAllPlans();
}

/**
 * Format price string helper
 */
export function formatPlanPrice(amount: number, durationDays: number): string {
  if (amount === 0) return "Free";
  if (durationDays === 30) return `₹${amount.toLocaleString("en-IN")} / mo`;
  if (durationDays === 90) return `₹${amount.toLocaleString("en-IN")} / 3 mos`;
  if (durationDays === 180) return `₹${amount.toLocaleString("en-IN")} / 6 mos`;
  if (durationDays === 365) return `₹${amount.toLocaleString("en-IN")} / yr`;
  return `₹${amount.toLocaleString("en-IN")} / ${durationDays} days`;
}

/**
 * Create a new subscription plan (Admin only)
 */
export function createSubscriptionPlan(data: {
  name: string;
  monthlyAmount: number;
  durationDays?: number;
  durationLabel?: string;
  specs?: string;
  quality?: string;
  resolution?: string;
  screens?: string;
  features?: string[];
  isPopular?: boolean;
}): SubscriptionPlanItem {
  const plans = getAllPlans();
  const durationDays = data.durationDays || 30;
  const durationLabel =
    data.durationLabel ||
    (durationDays === 30
      ? "1 Month (30 Days)"
      : durationDays === 90
      ? "3 Months (Quarterly)"
      : durationDays === 180
      ? "6 Months (Half-Yearly)"
      : durationDays === 365
      ? "1 Year (Annual VIP)"
      : `${durationDays} Days`);

  const slugId =
    data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 20) + `_${Date.now().toString(36).slice(-4)}`;

  const price = formatPlanPrice(data.monthlyAmount, durationDays);

  const newPlan: SubscriptionPlanItem = {
    id: slugId,
    name: data.name.trim(),
    price,
    monthlyAmount: Number(data.monthlyAmount),
    durationDays,
    durationLabel,
    specs: data.specs || `${data.quality || "Ultra HD"} Quality (${data.screens || "2 Screens"})`,
    quality: data.quality || "Great",
    resolution: data.resolution || "1080p Full HD",
    screens: data.screens || "2 Screens at once",
    features: data.features && data.features.length > 0 ? data.features : ["Unlimited Movies & Shows", "Ad-Free Streaming"],
    isPopular: !!data.isPopular,
    isActive: true,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [...plans, newPlan];
  savePlans(updated);
  return newPlan;
}

/**
 * Update an existing subscription plan (Admin only)
 */
export function updateSubscriptionPlan(
  id: string,
  updates: Partial<SubscriptionPlanItem>
): SubscriptionPlanItem | null {
  const plans = getAllPlans();
  const index = plans.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = plans[index];
  const newAmount = updates.monthlyAmount !== undefined ? Number(updates.monthlyAmount) : current.monthlyAmount;
  const newDuration = updates.durationDays !== undefined ? Number(updates.durationDays) : current.durationDays;
  const newPrice = formatPlanPrice(newAmount, newDuration);

  const updatedPlan: SubscriptionPlanItem = {
    ...current,
    ...updates,
    id, // protect ID
    price: updates.price || newPrice,
    monthlyAmount: newAmount,
    durationDays: newDuration,
  };

  plans[index] = updatedPlan;
  savePlans(plans);
  return updatedPlan;
}

/**
 * Toggle plan active/inactive status
 */
export function togglePlanStatus(id: string): SubscriptionPlanItem | null {
  const plans = getAllPlans();
  const plan = plans.find((p) => p.id === id);
  if (!plan) return null;

  return updateSubscriptionPlan(id, { isActive: !plan.isActive });
}

/**
 * Delete a custom plan or deactivate default plan
 */
export function deleteSubscriptionPlan(id: string): boolean {
  const plans = getAllPlans();
  const target = plans.find((p) => p.id === id);
  if (!target) return false;

  const filtered = plans.filter((p) => p.id !== id);
  savePlans(filtered);
  return true;
}

/**
 * Reset all plans to factory defaults
 */
export function resetPlansToDefaults(): SubscriptionPlanItem[] {
  localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(DEFAULT_PLANS));
  window.dispatchEvent(new CustomEvent("streamly:plans-change", { detail: DEFAULT_PLANS }));
  return DEFAULT_PLANS;
}
