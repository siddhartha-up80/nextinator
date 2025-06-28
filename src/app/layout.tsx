import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "@/lib/polyfills";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nextinator | Customised data based AI chat | Custom Data Chat Bot",
  description:
    "Nextinator is a custom data based AI chat app. It's like a virtual assistant, but it's based on your custom data. When you chat with Nextinator, it will use your existing notes, emails, and any other data you've added to the app to generate responses. This means that Nextinator will only generate responses that are relevant to you and your data. No more irrelevant notifications or spam from bots. Sign up now and start chatting with your personal AI today!",
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
        </head>{" "}
        <body className={inter.className}>
          <ToastProvider>
            <ThemeProvider>
              <SidebarProvider>
                <ChatHistoryProvider>{children}</ChatHistoryProvider>
              </SidebarProvider>
            </ThemeProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
