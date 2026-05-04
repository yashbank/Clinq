export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 motion-reduce:animate-none motion-reduce:transform-none animate-in fade-in-0 duration-200">
      {children}
    </div>
  );
}
