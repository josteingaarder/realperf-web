import { supabase } from '@/lib/supabase';
import type { ChipSource } from '@/lib/storage';

export type ArchitectureSource = ChipSource;

// These table names mirror the architecture migration so the UI data model and
// the future Supabase-backed dataset stay aligned as the page evolves.
export const architectureSchemaTableMap = {
  profiles: 'architecture_profiles',
  sections: 'architecture_profile_sections',
  highlights: 'architecture_topology_highlights',
  interfaceGroups: 'architecture_interface_groups',
  interfaceItems: 'architecture_interface_items',
  pendingFields: 'architecture_pending_fields',
} as const;

export interface ArchitectureChipCard {
  id: string;
  source: ArchitectureSource;
  name: string;
  manufacturer: string;
  category: string;
  architecture: string | null;
  processNode: string | null;
  memory: string;
  primaryMetric: string;
  href: string;
}

export interface ArchitectureInterfaceItem {
  name: string;
  definition: string;
  count: string;
  capability: string;
}

export interface ArchitectureInterfaceGroup {
  title: string;
  description: string;
  items: ArchitectureInterfaceItem[];
}

export interface ArchitectureProfileSection {
  title: string;
  value: string;
}

export interface ArchitectureProfile {
  id: string;
  source: ArchitectureSource;
  name: string;
  manufacturer: string;
  category: string;
  architecture: string | null;
  description: string;
  heroMetricLabel: string;
  heroMetricValue: string;
  sections: ArchitectureProfileSection[];
  topologyHighlights: string[];
  interfaceGroups: ArchitectureInterfaceGroup[];
  pendingFields: string[];
}

function formatPrimaryMetric(source: ArchitectureSource, metric: number | null | undefined) {
  if (metric == null) {
    return '—';
  }

  return source === 'cloud' ? `${metric.toLocaleString()} TFLOPS` : `${metric.toLocaleString()} TOPS`;
}

function formatMemory(value: number | null | undefined, type?: string | null) {
  if (value == null) {
    return 'Memory details pending';
  }

  return `${value.toLocaleString()} GB${type ? ` ${type}` : ''}`;
}

function buildCloudInterfaceGroups(name: string): ArchitectureInterfaceGroup[] {
  return [
    {
      title: 'Host and Expansion',
      description: 'How the accelerator attaches to the host platform and how expansion is expected to work.',
      items: [
        {
          name: 'PCIe / Host Attachment',
          definition: `Primary server attachment path for ${name}.`,
          count: 'Detailed lane count pending',
          capability: 'Used for host integration, DMA movement, and platform enumeration.',
        },
        {
          name: 'Scale-up Interconnect',
          definition: 'High-bandwidth accelerator-to-accelerator link coverage.',
          count: 'Link count pending',
          capability: 'Used for multi-GPU communication and large-model scale-up topologies.',
        },
      ],
    },
    {
      title: 'Memory and Fabric',
      description: 'Memory-side connectivity and rack or cluster networking paths.',
      items: [
        {
          name: 'HBM / Memory Channels',
          definition: 'On-package memory topology and memory-side interface details.',
          count: 'Channel count pending',
          capability: 'Defines local memory bandwidth and model-fit ceiling.',
        },
        {
          name: 'Ethernet / Fabric Readiness',
          definition: 'Cluster-facing connectivity notes for deployment fabrics.',
          count: 'Port definition pending',
          capability: 'Supports rack-scale inference and distributed training fabrics.',
        },
      ],
    },
  ];
}

function buildEdgeInterfaceGroups(name: string): ArchitectureInterfaceGroup[] {
  return [
    {
      title: 'Embedded and Host I/O',
      description: 'How the SoC or module connects to host carriers, embedded boards, and local peripherals.',
      items: [
        {
          name: 'PCIe / Module Expansion',
          definition: `Primary embedded expansion path for ${name}.`,
          count: 'Lane count pending',
          capability: 'Used for NVMe, accelerator expansion, and host-side connectivity.',
        },
        {
          name: 'Low-speed Control I/O',
          definition: 'Control buses and embedded peripheral interfaces.',
          count: 'Interface count pending',
          capability: 'Supports board integration, sensors, and management controllers.',
        },
      ],
    },
    {
      title: 'Sensor, Media, and Networking',
      description: 'Interfaces that matter for camera pipelines, streaming, and edge deployment.',
      items: [
        {
          name: 'Camera / Display',
          definition: 'Sensor ingress and display pipeline definition.',
          count: 'Port count pending',
          capability: 'Supports robotics, vision inference, and multimedia endpoints.',
        },
        {
          name: 'Network and Media Engines',
          definition: 'External network ports plus encode/decode path coverage.',
          count: 'Detailed capability pending',
          capability: 'Supports edge streaming, gateway workloads, and low-latency media serving.',
        },
      ],
    },
  ];
}

export async function fetchArchitectureCards(): Promise<ArchitectureChipCard[]> {
  const [{ data: cloudRows }, { data: edgeRows }] = await Promise.all([
    supabase
      .from('cloud_chips')
      .select('id,name,manufacturer,category,architecture,process_node,vram_gb,vram_type,fp16_tflops')
      .order('manufacturer', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('edge_chips')
      .select('id,name,manufacturer,category,process_node,vram_gb,ai_tops')
      .order('manufacturer', { ascending: true })
      .order('name', { ascending: true }),
  ]);

  const cloudCards: ArchitectureChipCard[] = (cloudRows ?? []).map((chip) => ({
    id: chip.id,
    source: 'cloud',
    name: chip.name,
    manufacturer: chip.manufacturer ?? 'Unknown vendor',
    category: chip.category ?? 'Cloud Accelerator',
    architecture: chip.architecture ?? null,
    processNode: chip.process_node ?? null,
    memory: formatMemory(chip.vram_gb, chip.vram_type),
    primaryMetric: formatPrimaryMetric('cloud', chip.fp16_tflops),
    href: `/architecture/cloud/${chip.id}`,
  }));

  const edgeCards: ArchitectureChipCard[] = (edgeRows ?? []).map((chip) => ({
    id: chip.id,
    source: 'edge',
    name: chip.name,
    manufacturer: chip.manufacturer ?? 'Unknown vendor',
    category: chip.category ?? 'Edge Accelerator',
    architecture: null,
    processNode: chip.process_node ?? null,
    memory: formatMemory(chip.vram_gb),
    primaryMetric: formatPrimaryMetric('edge', chip.ai_tops),
    href: `/architecture/edge/${chip.id}`,
  }));

  return [...cloudCards, ...edgeCards];
}

export async function fetchArchitectureProfile(
  source: ArchitectureSource,
  id: string
): Promise<ArchitectureProfile | null> {
  if (source === 'cloud') {
    const { data: chip } = await supabase
      .from('cloud_chips')
      .select(
        'id,name,manufacturer,category,architecture,process_node,form_factor,cooling_type,vram_gb,vram_type,tdp_watt,fp16_tflops,interconnect_bandwidth_gb_s,supported_precisions,tensor_core_count'
      )
      .eq('id', id)
      .single();

    if (!chip) {
      return null;
    }

    return {
      id: chip.id,
      source,
      name: chip.name,
      manufacturer: chip.manufacturer ?? 'Unknown vendor',
      category: chip.category ?? 'Cloud Accelerator',
      architecture: chip.architecture ?? null,
      description: chip.architecture
        ? `${chip.name} is currently indexed as a ${chip.architecture} cloud architecture entry. This page is the architecture-first view for tracking topology, interface coverage, and hardware integration detail.`
        : `${chip.name} is currently indexed as a cloud accelerator. This page is the architecture-first view for tracking topology, interface coverage, and hardware integration detail.`,
      heroMetricLabel: 'Peak Compute',
      heroMetricValue: formatPrimaryMetric('cloud', chip.fp16_tflops),
      sections: [
        { title: 'Architecture Family', value: chip.architecture ?? 'Pending dataset' },
        { title: 'Process Node', value: chip.process_node ?? 'Pending dataset' },
        { title: 'Form Factor', value: chip.form_factor ?? 'Pending dataset' },
        { title: 'Cooling', value: chip.cooling_type ?? 'Pending dataset' },
        { title: 'Memory Envelope', value: formatMemory(chip.vram_gb, chip.vram_type) },
        {
          title: 'Interconnect Bandwidth',
          value:
            chip.interconnect_bandwidth_gb_s == null
              ? 'Pending dataset'
              : `${chip.interconnect_bandwidth_gb_s.toLocaleString()} GB/s`,
        },
      ],
      topologyHighlights: [
        chip.tensor_core_count
          ? `${chip.tensor_core_count.toLocaleString()} tensor or matrix-oriented compute blocks recorded.`
          : 'Tensor or matrix core topology detail is not yet recorded.',
        chip.supported_precisions
          ? `Precision support currently lists ${chip.supported_precisions}.`
          : 'Supported precision matrix is not yet recorded.',
        chip.tdp_watt
          ? `Thermal envelope currently recorded at ${chip.tdp_watt} W TDP.`
          : 'Thermal envelope detail is pending.',
      ],
      interfaceGroups: buildCloudInterfaceGroups(chip.name),
      pendingFields: [
        'Architecture block diagram asset',
        'PCIe generation, lane width, and slot mapping',
        'NVLink / scale-up link count and bandwidth',
        'Cluster-facing Ethernet or fabric connectivity',
        'Detailed media, virtualization, and security engines',
      ],
    };
  }

  const { data: chip } = await supabase
    .from('edge_chips')
    .select('id,name,manufacturer,category,process_node,vram_gb,tdp_watt,ai_tops')
    .eq('id', id)
    .single();

  if (!chip) {
    return null;
  }

  return {
    id: chip.id,
    source,
    name: chip.name,
    manufacturer: chip.manufacturer ?? 'Unknown vendor',
    category: chip.category ?? 'Edge Accelerator',
    architecture: null,
    description: `${chip.name} is currently indexed as an edge-oriented accelerator. This architecture view is designed to track SoC block layout, external I/O, embedded expansion, and deployment capability detail.`,
    heroMetricLabel: 'AI Throughput',
    heroMetricValue: formatPrimaryMetric('edge', chip.ai_tops),
    sections: [
      { title: 'Architecture Family', value: 'Pending dataset' },
      { title: 'Process Node', value: chip.process_node ?? 'Pending dataset' },
      { title: 'Package / Module Type', value: 'Pending dataset' },
      { title: 'Power Envelope', value: chip.tdp_watt ? `${chip.tdp_watt} W` : 'Pending dataset' },
      { title: 'Memory Envelope', value: formatMemory(chip.vram_gb) },
      { title: 'Deployment Style', value: 'Embedded / edge integration details pending' },
    ],
    topologyHighlights: [
      chip.ai_tops
        ? `Peak edge AI throughput currently recorded at ${chip.ai_tops.toLocaleString()} TOPS.`
        : 'Peak edge AI throughput detail is pending.',
      chip.vram_gb
        ? `Local memory capacity currently recorded at ${chip.vram_gb.toLocaleString()} GB.`
        : 'Memory capacity detail is pending.',
      'Camera, display, networking, and low-speed I/O coverage are planned next.',
    ],
    interfaceGroups: buildEdgeInterfaceGroups(chip.name),
    pendingFields: [
      'Architecture diagram and subsystem map',
      'Camera, display, and media pipeline definitions',
      'PCIe, M.2, and carrier-board lane mapping',
      'Ethernet, CAN, UART, SPI, and GPIO interface coverage',
      'Security enclave, virtualization, and codec engine detail',
    ],
  };
}
