export default function GestaoLayout({ children }) {
  // We don't render the global cart or navigation here.
  // We use standard layout since we are decoupling it from the store.
  return (
    <div className="bg-slate-50 min-h-screen">
      {children}
    </div>
  );
}
