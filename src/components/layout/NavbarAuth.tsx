"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function NavbarAuth() {
  const { isSignedIn, isLoaded } = useUser();

  // Avoid layout shift while Clerk loads
  if (!isLoaded) {
    return <div className="w-32 h-9" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-5">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
              userButtonPopoverCard: "border border-zinc-200 dark:border-zinc-700 shadow-lg",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center h-9 px-4 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
