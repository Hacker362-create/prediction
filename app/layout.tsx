import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Pitch Intelligence — Football, quantified",
  description: "Data-led football match probabilities, fixture intelligence and transparent model performance.",
  applicationName: "Pitch Intelligence",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}