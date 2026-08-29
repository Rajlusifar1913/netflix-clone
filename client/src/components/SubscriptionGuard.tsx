import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/lib/mockAuth";
import { apiRequest } from "@/lib/api";

interface SubscriptionCheckResult {
  status: string;
  planId: string;
  currentPeriodEnd: string | null;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, status: authStatus } = useSession();
  const [isSubValid, setIsSubValid] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. If unauthenticated, redirect to login
    if (authStatus === "unauthenticated") {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (authStatus === "loading") {
      return;
    }

    // 2. Check bypass for Demo User or Admin User
    const email = session?.user?.email?.toLowerCase().trim() || "";
    const isDemoUser = email === "demo@streamly.com";
    const isAdminUser = email === "admin@streamly.com" || session?.user?.role === "admin";

    if (isDemoUser || isAdminUser) {
      setIsSubValid(true);
      return;
    }

    // 3. Verify live subscription status from server
    let isMounted = true;
    apiRequest<{ data: { subscription: SubscriptionCheckResult } }>("/payments/subscription")
      .then((res) => {
        if (!isMounted) return;
        const sub = res?.data?.subscription;

        if (!sub || sub.status !== "active" || !sub.currentPeriodEnd) {
          setIsSubValid(false);
          navigate("/plans", {
            replace: true,
            state: {
              required: true,
              message: "Please choose a subscription plan to unlock unlimited streaming.",
            },
          });
          return;
        }

        const isExpired = new Date(sub.currentPeriodEnd).getTime() <= Date.now();
        if (isExpired) {
          setIsSubValid(false);
          navigate("/plans", {
            replace: true,
            state: {
              expired: true,
              message: "Your subscription plan validity has expired. Please choose a plan to continue streaming.",
            },
          });
          return;
        }

        // Active and valid!
        setIsSubValid(true);
      })
      .catch(() => {
        if (!isMounted) return;
        // If API fails or user has no subscription record, redirect to plans
        setIsSubValid(false);
        navigate("/plans", {
          replace: true,
          state: {
            required: true,
            message: "Active subscription plan required to stream movies and series.",
          },
        });
      });

    return () => {
      isMounted = false;
    };
  }, [authStatus, session, navigate, location.pathname]);

  if (authStatus === "loading" || isSubValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#e50914] border-t-transparent" />
          <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">
            Verifying Streamly Membership...
          </span>
        </div>
      </div>
    );
  }

  if (!isSubValid) {
    return null;
  }

  return <>{children}</>;
}
