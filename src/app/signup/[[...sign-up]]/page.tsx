import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="font-bold text-2xl text-zinc-900 dark:text-white">
            Prompt<span className="text-violet-600">Market</span>
          </a>
          <p className="text-zinc-500 mt-2 text-sm">Create your free account</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: "shadow-none border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900",
              headerTitle: "text-zinc-900 dark:text-white font-bold",
              headerSubtitle: "text-zinc-500",
              formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white rounded-lg",
              footerActionLink: "text-violet-600 hover:text-violet-700",
              formFieldInput: "rounded-lg border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
              socialButtonsBlockButton: "border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
