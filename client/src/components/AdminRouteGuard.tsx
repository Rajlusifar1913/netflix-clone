import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const auth = isAdminAuthenticated();
      setIsAuthenticated(auth);
      if (!auth && location.pathname !== "/admin/login") {
        navigate("/admin/login", { replace: true, state: { from: location.pathname } });
      }
    };

    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener("streamly:admin-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("streamly:admin-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [navigate, location.pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#e50914] border-t-transparent" />
          <span className="text-xs text-gray-400 font-medium tracking-wide">VERIFYING ADMIN PRIVILEGES...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
