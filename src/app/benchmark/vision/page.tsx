import type { Metadata } from 'next';
import BenchmarkCategoryPage from '@/app/benchmark/BenchmarkCategoryPage';

export const metadata: Metadata = {
  title: 'Vision Model Performance',
  description:
    'Benchmark page for comparing cloud and edge chips on vision model workloads and model coverage.',
};

export default function VisionBenchmarkPage() {
  return <BenchmarkCategoryPage category="vision" />;
}
