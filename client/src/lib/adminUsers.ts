/**
 * adminUsers.ts
 * Dedicated user & subscription management system for Streamly Admin Portal.
 * Bridges with `streamly_users` (from mockAuth), provides search, filtering, creation, role editing,
 * user deletion, and comprehensive subscription lifecycle management (Upgrade, Downgrade, Extend, Cancel, Reactivate, VIP).
 */

import {
  getAllPlans,
  getPlanById,
} from "./plansStore";
import { apiRequest } from "./api";

export interface UserSubscriptionDetails {
  status: "active" | "canceled" | "past_due" | "unpaid" | "trial";
  planId: string;
  planName: string;
  planSpecs: string;
  price: string;
  monthlyAmount: number;
  screens: number;
  quality: string;
  cardLast4: string;
  cardBrand: string;
  billingCycle: "monthly" | "yearly" | "custom";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isComplimentary?: boolean;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  planId: string;
  planName: string;
  status: "active" | "suspended" | "pending";
  authProvider: "local" | "google";
  avatar?: string;
  createdAt: string;
  lastActive: string;
  totalViews: number;
  subscription: UserSubscriptionDetails;
}

export function getPlanConfig(planId: string) {
  const p = getPlanById(planId);
  if (p) {
    return {
      name: p.name,
      specs: p.specs,
      price: p.price,
      monthlyAmount: p.monthlyAmount,
      screens: parseInt(p.screens) || 2,
      quality: p.quality || "1080p Full HD",
    };
  }
  return {
    name: "Ultra 4K HDR",
    specs: "Ultra HD 4K + HDR (4 Screens at once)",
    price: "₹649 / mo",
    monthlyAmount: 649,
    screens: 4,
    quality: "4K + HDR Ultra HD",
  };
}

export const PLAN_CONFIG: Record<
  string,
  {
    name: string;
    specs: string;
    price: string;
    monthlyAmount: number;
    screens: number;
    quality: string;
  }
> = new Proxy(
  {},
  {
    get: (_, prop: string) => getPlanConfig(prop),
  }
);

const USERS_KEY = "streamly_users";
const MANAGED_USERS_KEY = "streamly_admin_managed_users";

function futureDateISO(daysAhead = 30): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
}

const DEFAULT_USERS_SEED: AdminManagedUser[] = [
  {
    id: "usr_admin",
    name: "Admin User",
    email: "admin@streamly.com",
    role: "admin",
    planId: "premium",
    planName: "Ultra 4K HDR",
    status: "active",
    authProvider: "local",
    avatar: "linear-gradient(135deg,#e50914,#ff3b30)",
    createdAt: "2024-01-01T00:00:00Z",
    lastActive: "Active Now",
    totalViews: 240,
    subscription: {
      status: "active",
      planId: "premium",
      planName: "Ultra 4K HDR",
      planSpecs: "Ultra HD 4K + HDR (4 Screens at once)",
      price: "₹649 / mo",
      monthlyAmount: 649,
      screens: 4,
      quality: "4K + HDR Ultra HD",
      cardLast4: "4242",
      cardBrand: "visa",
      billingCycle: "yearly",
      currentPeriodEnd: futureDateISO(365),
      cancelAtPeriodEnd: false,
      isComplimentary: true,
    },
  },
  {
    id: "usr_1",
    name: "Jane Doe",
    email: "jane.doe@streamly.io",
    role: "user",
    planId: "premium",
    planName: "Ultra 4K HDR",
    status: "active",
    authProvider: "local",
    avatar: "linear-gradient(135deg,#e50914,#b81d24)",
    createdAt: "2024-01-15T08:30:00Z",
    lastActive: "Just now",
    totalViews: 84,
    subscription: {
      status: "active",
      planId: "premium",
      planName: "Ultra 4K HDR",
      planSpecs: "Ultra HD 4K + HDR (4 Screens at once)",
      price: "₹649 / mo",
      monthlyAmount: 649,
      screens: 4,
      quality: "4K + HDR Ultra HD",
      cardLast4: "4242",
      cardBrand: "visa",
      billingCycle: "monthly",
      currentPeriodEnd: futureDateISO(24),
      cancelAtPeriodEnd: false,
    },
  },
  {
    id: "usr_2",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    role: "user",
    planId: "premium",
    planName: "Ultra 4K HDR",
    status: "active",
    authProvider: "google",
    avatar: "linear-gradient(135deg,#0072d2,#62d5ff)",
    createdAt: "2024-01-20T14:15:00Z",
    lastActive: "12 mins ago",
    totalViews: 112,
    subscription: {
      status: "active",
      planId: "premium",
      planName: "Ultra 4K HDR",
      planSpecs: "Ultra HD 4K + HDR (4 Screens at once)",
      price: "₹649 / mo",
      monthlyAmount: 649,
      screens: 4,
      quality: "4K + HDR Ultra HD",
      cardLast4: "8890",
      cardBrand: "mastercard",
      billingCycle: "monthly",
      currentPeriodEnd: futureDateISO(18),
      cancelAtPeriodEnd: false,
    },
  },
  {
    id: "usr_3",
    name: "Sarah Connor",
    email: "sarah.c@gmail.com",
    role: "user",
    planId: "standard",
    planName: "Standard 1080p",
    status: "active",
    authProvider: "local",
    avatar: "linear-gradient(135deg,#10b981,#059669)",
    createdAt: "2024-02-01T10:00:00Z",
    lastActive: "1 hour ago",
    totalViews: 65,
    subscription: {
      status: "active",
      planId: "standard",
      planName: "Standard 1080p",
      planSpecs: "Full HD 1080p (2 Screens at once)",
      price: "₹499 / mo",
      monthlyAmount: 499,
      screens: 2,
      quality: "1080p Full HD",
      cardLast4: "1122",
      cardBrand: "amex",
      billingCycle: "monthly",
      currentPeriodEnd: futureDateISO(15),
      cancelAtPeriodEnd: false,
    },
  },
  {
    id: "usr_4",
    name: "Michael Scott",
    email: "michael.s@dundermifflin.com",
    role: "user",
    planId: "mobile",
    planName: "Mobile 720p",
    status: "suspended",
    authProvider: "local",
    avatar: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    createdAt: "2024-02-10T16:45:00Z",
    lastActive: "3 days ago",
    totalViews: 38,
    subscription: {
      status: "past_due",
      planId: "mobile",
      planName: "Mobile 720p",
      planSpecs: "720p HD (1 Screen on Mobile/Tablet)",
      price: "₹149 / mo",
      monthlyAmount: 149,
      screens: 1,
      quality: "480p/720p SD",
      cardLast4: "9911",
      cardBrand: "visa",
      billingCycle: "monthly",
      currentPeriodEnd: futureDateISO(-2),
      cancelAtPeriodEnd: true,
    },
  },
  {
    id: "usr_5",
    name: "Elena Gilbert",
    email: "elena.g@mysticfalls.org",
    role: "user",
    planId: "standard",
    planName: "Standard 1080p",
    status: "active",
    authProvider: "google",
    avatar: "linear-gradient(135deg,#f59e0b,#d97706)",
    createdAt: "2024-02-18T11:20:00Z",
    lastActive: "4 hours ago",
    totalViews: 93,
    subscription: {
      status: "active",
      planId: "standard",
      planName: "Standard 1080p",
      planSpecs: "Full HD 1080p (2 Screens at once)",
      price: "₹499 / mo",
      monthlyAmount: 499,
      screens: 2,
      quality: "1080p Full HD",
      cardLast4: "4242",
      cardBrand: "visa",
      billingCycle: "monthly",
      currentPeriodEnd: futureDateISO(28),
      cancelAtPeriodEnd: false,
    },
  },
];

/**
 * Returns all users in the system, combining mockAuth registered users + managed users
 */
export function getAllAdminUsers(): AdminManagedUser[] {
  try {
    let managed: AdminManagedUser[] = [];
    const raw = localStorage.getItem(MANAGED_USERS_KEY);
    if (!raw) {
      managed = DEFAULT_USERS_SEED;
      localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(DEFAULT_USERS_SEED));
    } else {
      managed = JSON.parse(raw) as AdminManagedUser[];
    }

    // Ensure all users have well-formed subscription objects
    let needsResave = false;
    managed = managed.map((u) => {
      const cfg = getPlanConfig(u.planId || "premium");
      if (!u.subscription) {
        needsResave = true;
        return {
          ...u,
          planId: u.planId || "premium",
          planName: cfg.name,
          subscription: {
            status: u.status === "active" ? "active" : "canceled",
            planId: u.planId || "premium",
            planName: cfg.name,
            planSpecs: cfg.specs,
            price: cfg.price,
            monthlyAmount: cfg.monthlyAmount,
            screens: cfg.screens,
            quality: cfg.quality,
            cardLast4: "4242",
            cardBrand: "visa",
            billingCycle: "monthly",
            currentPeriodEnd: futureDateISO(30),
            cancelAtPeriodEnd: false,
          },
        };
      }
      return u;
    });

    if (needsResave) {
      localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(managed));
    }

    // Sync with `streamly_users` (from mockAuth registration)
    const rawAuthUsers = localStorage.getItem(USERS_KEY);
    if (rawAuthUsers) {
      const authUsers = JSON.parse(rawAuthUsers) as { id: string; name: string; email: string }[];
      authUsers.forEach((au) => {
        const exists = managed.some((m) => m.email.toLowerCase() === au.email.toLowerCase());
        if (!exists) {
          const cfg = getPlanConfig("premium");
          managed.unshift({
            id: au.id || `usr_${Date.now()}`,
            name: au.name || "Member",
            email: au.email,
            role: "user",
            planId: "premium",
            planName: cfg.name,
            status: "active",
            authProvider: "local",
            avatar: "linear-gradient(135deg,#0072d2,#62d5ff)",
            createdAt: new Date().toISOString(),
            lastActive: "Recent",
            totalViews: 1,
            subscription: {
              status: "active",
              planId: "premium",
              planName: cfg.name,
              planSpecs: cfg.specs,
              price: cfg.price,
              monthlyAmount: cfg.monthlyAmount,
              screens: cfg.screens,
              quality: cfg.quality,
              cardLast4: "4242",
              cardBrand: "visa",
              billingCycle: "monthly",
              currentPeriodEnd: futureDateISO(30),
              cancelAtPeriodEnd: false,
            },
          });
        }
      });
    }

    return managed;
  } catch {
    return DEFAULT_USERS_SEED;
  }
}

function saveUsers(users: AdminManagedUser[]): void {
  localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent("streamly:users-change", { detail: users }));
}

/**
 * Async fetch users from backend API /admin/users
 */
export async function fetchServerAdminUsers(): Promise<AdminManagedUser[]> {
  try {
    const res = await apiRequest<{ data: Record<string, unknown>[] }>("/admin/users");
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const formatted: AdminManagedUser[] = res.data.map((u) => {
        const sub = (u.subscription || {}) as Record<string, unknown>;
        const planId = (sub.planId as string) || "premium";
        const cfg = getPlanConfig(planId);

        return {
          id: (u.id || u._id) as string,
          name: (u.name as string) || "Member",
          email: (u.email as string) || "",
          role: (u.role as "user" | "admin") || "user",
          planId,
          planName: (sub.planName as string) || cfg.name,
          status: (sub.status === "suspended" ? "suspended" : "active") as "active" | "suspended" | "pending",
          authProvider: (u.authProvider as "local" | "google") || "local",
          avatar: (u.avatar as string) || "linear-gradient(135deg,#0072d2,#62d5ff)",
          createdAt: (u.createdAt as string) || new Date().toISOString(),
          lastActive: "Active Now",
          totalViews: 45,
          subscription: {
            status: (sub.status as UserSubscriptionDetails["status"]) || "active",
            planId,
            planName: (sub.planName as string) || cfg.name,
            planSpecs: (sub.planSpecs as string) || cfg.specs,
            price: cfg.price,
            monthlyAmount: cfg.monthlyAmount,
            screens: cfg.screens,
            quality: cfg.quality,
            cardLast4: (sub.cardLast4 as string) || "4242",
            cardBrand: (sub.cardBrand as string) || "visa",
            billingCycle: "monthly",
            currentPeriodEnd: (sub.currentPeriodEnd as string) || futureDateISO(30),
            cancelAtPeriodEnd: !!sub.cancelAtPeriodEnd,
          },
        };
      });

      saveUsers(formatted);
      return formatted;
    }
  } catch {
    // Fall back to local storage
  }
  return getAllAdminUsers();
}

/**
 * Create a new user from the Admin panel
 */
export function createAdminUser(data: {
  name: string;
  email: string;
  role?: "user" | "admin";
  planId?: string;
  status?: "active" | "suspended" | "pending";
}): AdminManagedUser {
  const users = getAllAdminUsers();
  const planId = data.planId || "premium";
  const cfg = getPlanConfig(planId);

  const newUser: AdminManagedUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    role: data.role || "user",
    planId,
    planName: cfg.name,
    status: data.status || "active",
    authProvider: "local",
    avatar: "linear-gradient(135deg,#0072d2,#62d5ff)",
    createdAt: new Date().toISOString(),
    lastActive: "Just created",
    totalViews: 0,
    subscription: {
      status: data.status === "active" ? "active" : "unpaid",
      planId,
      planName: cfg.name,
      planSpecs: cfg.specs,
      price: cfg.price,
      monthlyAmount: cfg.monthlyAmount,
      screens: cfg.screens,
      quality: cfg.quality,
      cardLast4: "4242",
      cardBrand: "visa",
      billingCycle: "monthly",
      currentPeriodEnd: futureDateISO(30),
      cancelAtPeriodEnd: false,
    },
  };

  const updated = [newUser, ...users];
  saveUsers(updated);

  // Sync with streamly_users for login
  try {
    const rawAuth = localStorage.getItem(USERS_KEY);
    const authList = rawAuth ? JSON.parse(rawAuth) : [];
    if (!authList.some((u: { email: string }) => u.email.toLowerCase() === newUser.email)) {
      authList.push({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        passwordHash: btoa("password123"),
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(authList));
    }
  } catch {
    // Ignore storage errors
  }

  return newUser;
}

/**
 * Update user details or plan
 */
export function updateAdminUser(id: string, updates: Partial<AdminManagedUser>): AdminManagedUser | null {
  const users = getAllAdminUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const current = users[index];
  const updatedUser: AdminManagedUser = {
    ...current,
    ...updates,
    id, // protect ID
  };

  users[index] = updatedUser;
  saveUsers(users);
  return updatedUser;
}

/**
 * Update User Subscription (Plan, Status, Expiration, Billing Cycle, Card)
 */
export function updateUserSubscription(
  userId: string,
  newPlanId: string,
  status?: UserSubscriptionDetails["status"],
  customExpiryISO?: string,
  cardBrand?: string,
  cardLast4?: string
): AdminManagedUser | null {
  const users = getAllAdminUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const cfg = getPlanConfig(newPlanId);

  const updatedSub: UserSubscriptionDetails = {
    ...current.subscription,
    planId: newPlanId,
    planName: cfg.name,
    planSpecs: cfg.specs,
    price: cfg.price,
    monthlyAmount: cfg.monthlyAmount,
    screens: cfg.screens,
    quality: cfg.quality,
    status: status || current.subscription?.status || "active",
    currentPeriodEnd: customExpiryISO || current.subscription?.currentPeriodEnd || futureDateISO(30),
    cardBrand: cardBrand || current.subscription?.cardBrand || "visa",
    cardLast4: cardLast4 || current.subscription?.cardLast4 || "4242",
    cancelAtPeriodEnd: status === "canceled",
  };

  const updatedUser: AdminManagedUser = {
    ...current,
    planId: newPlanId,
    planName: cfg.name,
    subscription: updatedSub,
  };

  users[index] = updatedUser;
  saveUsers(users);
  return updatedUser;
}

/**
 * Extend user's subscription period (e.g. +30 days, +90 days, +365 days)
 */
export function extendUserSubscription(userId: string, additionalDays = 30): AdminManagedUser | null {
  const users = getAllAdminUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const currentEnd = current.subscription?.currentPeriodEnd
    ? new Date(current.subscription.currentPeriodEnd).getTime()
    : Date.now();
  const baseTime = Math.max(Date.now(), currentEnd);
  const newEndTime = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000).toISOString();

  const updatedSub: UserSubscriptionDetails = {
    ...current.subscription,
    currentPeriodEnd: newEndTime,
    status: "active",
    cancelAtPeriodEnd: false,
  };

  const updatedUser: AdminManagedUser = {
    ...current,
    subscription: updatedSub,
  };

  users[index] = updatedUser;
  saveUsers(users);
  return updatedUser;
}

/**
 * Grant VIP / Lifetime complimentary 4K pass
 */
export function grantVIPPass(userId: string): AdminManagedUser | null {
  return updateUserSubscription(
    userId,
    "premium",
    "active",
    futureDateISO(365 * 3), // 3 years complimentary VIP pass
    "visa",
    "VIP"
  );
}

/**
 * Cancel or Reactivate subscription
 */
export function toggleCancelSubscription(userId: string): AdminManagedUser | null {
  const users = getAllAdminUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const isCurrentlyActive = current.subscription?.status === "active";
  const newStatus = isCurrentlyActive ? "canceled" : "active";

  const updatedSub: UserSubscriptionDetails = {
    ...current.subscription,
    status: newStatus,
    cancelAtPeriodEnd: isCurrentlyActive,
  };

  const updatedUser: AdminManagedUser = {
    ...current,
    subscription: updatedSub,
  };

  users[index] = updatedUser;
  saveUsers(users);
  return updatedUser;
}

/**
 * Permanently delete user
 */
export function deleteAdminUser(id: string): boolean {
  const users = getAllAdminUsers();
  const targetUser = users.find((u) => u.id === id);
  const filtered = users.filter((u) => u.id !== id);

  if (filtered.length === users.length) return false;

  saveUsers(filtered);

  // Also remove from streamly_users
  if (targetUser) {
    try {
      const rawAuth = localStorage.getItem(USERS_KEY);
      if (rawAuth) {
        const authList = JSON.parse(rawAuth) as { id?: string; email?: string }[];
        const updatedAuth = authList.filter(
          (u) => u.id !== id && u.email?.toLowerCase() !== targetUser.email.toLowerCase()
        );
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedAuth));
      }
    } catch {
      // Ignore error
    }
  }

  return true;
}

/**
 * Toggle user active/suspended status
 */
export function toggleUserStatus(id: string): AdminManagedUser | null {
  const users = getAllAdminUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;

  const nextStatus: AdminManagedUser["status"] = user.status === "active" ? "suspended" : "active";
  return updateAdminUser(id, { status: nextStatus });
}

/**
 * Calculate Aggregate Subscription Analytics (MRR, Plan Breakdown, Active Ratio)
 */
export function getSubscriptionAnalytics() {
  const users = getAllAdminUsers();
  const allPlans = getAllPlans();

  const totalMRR = users
    .filter((u) => u.subscription?.status === "active")
    .reduce((sum, u) => sum + (u.subscription?.monthlyAmount || 0), 0);

  const activeCount = users.filter((u) => u.subscription?.status === "active").length;
  const canceledCount = users.filter((u) => u.subscription?.status === "canceled").length;
  const pastDueCount = users.filter((u) => u.subscription?.status === "past_due").length;

  const planBreakdown: Record<string, number> = {};
  allPlans.forEach((p) => {
    planBreakdown[p.id] = users.filter((u) => u.planId === p.id).length;
  });

  return {
    totalMRR: Math.round(totalMRR * 100) / 100,
    annualRunRate: Math.round(totalMRR * 12),
    activeSubscribers: activeCount,
    canceledSubscribers: canceledCount,
    pastDueSubscribers: pastDueCount,
    planBreakdown,
    totalUsers: users.length,
    arpu: activeCount > 0 ? (totalMRR / activeCount).toFixed(2) : "0.00",
  };
}
