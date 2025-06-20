import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nextinator | Your All Data",
};

export default function AllDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
