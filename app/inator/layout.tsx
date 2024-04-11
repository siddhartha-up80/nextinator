import SidebarContainer from "@/components/main/sidebarcontainer";

export default function OptiflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div>
        <SidebarContainer />
      </div>
      <div className="md:ml-[300px] md:mt-14 mt-20 p-4 md:p-0">{children}</div>
    </div>
  );
}
