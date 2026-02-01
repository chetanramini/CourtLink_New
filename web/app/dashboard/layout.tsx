import TopNavbar from "@/components/TopNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gator-gradient">
      <TopNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
