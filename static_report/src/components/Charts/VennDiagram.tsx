import {
  ChartOptions,
  Chart as ChartJS,
  Tooltip,
  ChartData,
  LinearScale,
  CategoryScale,
  Legend,
  LegendItem,
  AnimationOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import {
  VennDiagramChart,
  VennDiagramController,
  EulerDiagramChart,
  EulerDiagramController,
  ArcSlice,
  extractSets,
} from 'chartjs-chart-venn';
import { INFO_VAL_COLOR } from '../../utils';
import { ReconcileTableMetrics } from '../../types';

/**
 * Venn Diagram that can display intersections and exclusive elements across two or more datasets
 */

export interface VennDiagramProps {
  data: ReconcileTableMetrics;
  animation?: AnimationOptions<'venn'>['animation'];
}

export function VennDiagram({ data, animation = false }: VennDiagramProps) {
  ChartJS.register(
    // VennDiagramChart,
    // VennDiagramController,
    EulerDiagramChart,
    EulerDiagramController,
    ArcSlice,
    LinearScale,
    CategoryScale,
  );

  const chartOptions = getVennDiagramOptions(data);
  const chartData = getVennDiagramData(data);

  return (
    <Chart
      type={'euler'}
      data={chartData}
      options={chartOptions}
      plugins={[Tooltip]}
    />
  );
}

export function getVennDiagramData(
  data: ReconcileTableMetrics,
): ChartData<'venn'> {
  const { base_only, target_only, common } = data;

  return {
    labels: ['base', 'target', 'base ∩ target'],
    datasets: [
      {
        label: 'reconcile',
        background: 'blue',
        data: [
          { sets: ['target'], value: target_only },
          { sets: ['base'], value: base_only },
          { sets: ['base', 'target'], value: common },
        ],
      },
    ],
  };
}
export function getVennDiagramOptions(
  data: ReconcileTableMetrics,
): ChartOptions<'venn'> {
  return {
    title: {
      display: true,
      text: 'Table comparison',
    },
    elements: {
      arcSlice: {
        background: 'red',
      },
    },
    borderwidth: 1,
    backgroundColor: [
      'rgba(255, 26, 104, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 206, 86, 0.2)',
    ],
    borderColor: [
      'rgba(255, 26, 104, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
    ],
  };
}
