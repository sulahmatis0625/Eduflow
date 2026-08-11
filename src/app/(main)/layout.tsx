import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-0">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer variant="minimal" />
    </div>
  );
}
