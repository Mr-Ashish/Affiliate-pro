export const revalidate = 120;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-theme flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
