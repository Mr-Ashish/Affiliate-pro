export type AdminTopBarProps = {
  title: string;
  userEmail?: string | null;
};

export function AdminTopBar({ title, userEmail }: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-outline-variant/60 bg-surface-lowest/95 px-6 backdrop-blur">
      <h1 className="text-lg font-semibold text-on-surface">{title}</h1>
      {userEmail ? (
        <p className="text-sm text-on-surface-variant">
          <span className="font-medium text-on-surface">{userEmail}</span>
        </p>
      ) : null}
    </header>
  );
}
