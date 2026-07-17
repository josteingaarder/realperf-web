import type { Metadata } from 'next';
import BenchmarkCategoryPage from '@/app/benchmark/BenchmarkCategoryPage';

export const metadata: Metadata = {
  title: 'Speech Model Performance',
  description:
    'Benchmark page for comparing cloud and edge chips on speech model workloads and model coverage.',
};

export default function SpeechBenchmarkPage() {
  return <BenchmarkCategoryPage category="speech" />;
}
