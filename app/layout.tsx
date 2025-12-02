import { ReactNode } from "react";
import { Russo_One, Rajdhani, Exo_2 } from "next/font/google";
import "./style.css";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo-one",
});

const rajdhani = Rajdhani({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

const exo2 = Exo_2({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-exo2",
});

export const metadata = {
  title: "Tribes 2 Map Gallery",
  description: "Tribes 2 forever.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${russoOne.variable} ${rajdhani.variable} ${exo2.variable}`}>
      <body>{children}</body>
    </html>
  );
}
