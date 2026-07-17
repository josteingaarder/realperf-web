import type { Metadata } from 'next';
import BenchmarkCategoryPage from '@/app/benchmark/BenchmarkCategoryPage';

export const metadata: Metadata = {
  title: 'LLM Model Performance',
  description:
    'Benchmark page for comparing cloud and edge chips on large language model workloads and model coverage.',
};

export default function LLMBenchmarkPage() {
  return <BenchmarkCategoryPage category="llm" />;
}
