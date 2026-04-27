import type { Metadata } from "next";
import { BecomeSeller } from "./BecomeSeller";

export const metadata: Metadata = {
  title: "Become a Seller – Start Earning with Your AI Prompts",
  robots: { index: false },
};

export default function BecomeSellerPage() {
  return <BecomeSeller />;
}
