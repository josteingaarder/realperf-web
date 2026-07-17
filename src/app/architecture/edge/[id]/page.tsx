import type { Metadata } from 'next';
import ArchitectureDetailPage from '@/app/architecture/ArchitectureDetailPage';

export const metadata: Metadata = {
  title: 'Edge Architecture',
  description:
    'Architecture detail page for edge AI chips, covering topology, external interfaces, embedded integration, and hardware capability notes.',
};

export default async function EdgeArchitectureDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  return <ArchitectureDetailPage source="edge" id={params.id} />;
}
