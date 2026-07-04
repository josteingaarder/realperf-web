import { Suspense } from 'react';
import CompareContent from './CompareContent';

export default function ComparePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </main>
    }>
      <CompareContent />
    </Suspense>
  );
}