import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nextinator | customised data based AI chat",
  description: "Customised data based AI chat, generate responses tailored to your specific needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta
            name="google-site-verification"
            content="wuKkVFD1dhs31EjQNk81yBbw-temshhMPPc8JGAUC94"
          />
        </head>
        <body className={inter.className}>
          <div>{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
