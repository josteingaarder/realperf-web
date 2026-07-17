import type { Metadata } from 'next';
import ArchitectureDetailPage from '@/app/architecture/ArchitectureDetailPage';

export const metadata: Metadata = {
  title: 'Cloud Architecture',
  description:
    'Architecture detail page for cloud AI accelerators, covering topology, interfaces, bandwidth, and deployment-facing hardware details.',
};

export default async function CloudArchitectureDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  return <ArchitectureDetailPage source="cloud" id={params.id} />;
}
