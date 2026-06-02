export default function StoresPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-24 pb-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-6a3 3 0 0 0-6 0v6"/><path d="M9 3h6a3 3 0 0 1 3 3v12H6V6a3 3 0 0 1 3-3z"/></svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">App Store</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        Apps coming soon. Stay tuned for integrations.
      </p>
      <span className="mt-4 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">Coming Soon</span>
    </div>
  );
}
