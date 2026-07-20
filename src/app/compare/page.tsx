import { Suspense } from 'react';
import CompareContent from './CompareContent';
import { getCollectionViewer } from '@/lib/account-collections';

export default async function ComparePage() {
  const viewer = await getCollectionViewer();

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </main>
    }>
      <CompareContent canSaveCollections={Boolean(viewer)} />
    </Suspense>
  );
}
