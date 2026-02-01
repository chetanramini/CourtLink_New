"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchUserAttributes } from "aws-amplify/auth";
import TopNavbar from "@/components/TopNavbar";
import CompleteProfileDialog from "@/components/CompleteProfileDialog";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  async function checkAuth() {
    // If we are on an admin route, defer to the admin page's own auth check
    if (pathname?.includes("/admin")) {
      setIsAuthenticated(true); // Allow rendering, let admin page handle strict check
      setIsLoading(false);
      return;
    }

    try {
      await fetchUserAttributes();
      setIsAuthenticated(true);
    } catch (e) {
      // Not authenticated
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gator-gradient">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (!isAuthenticated && !pathname?.includes("/admin")) {
    return null; // Prevents flash of content before redirect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gator-gradient">
      <TopNavbar />
      <CompleteProfileDialog />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
