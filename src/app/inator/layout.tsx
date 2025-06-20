import SidebarContainer from "@/components/main/sidebarcontainer";

export default function OptiflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarContainer>{children}</SidebarContainer>;
}
