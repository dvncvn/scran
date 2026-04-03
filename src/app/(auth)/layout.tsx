import { ThemeToggle } from "../../../components/features/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle compact />
      </div>
      {children}
    </>
  );
}
