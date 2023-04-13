import {
  Chart as ChartJS,
  Tooltip,
  LinearScale,
  CategoryScale,
  AnimationOptions,
} from 'chart.js';
import {
  VennDiagramChart,
  VennDiagramController,
  EulerDiagramChart,
  EulerDiagramController,
  ArcSlice,
} from 'chartjs-chart-venn';

import { Chart } from 'react-chartjs-2';
import { ReconcileTableMetrics } from '../../types';

/**
 * Venn Diagram that can display intersections and exclusive elements across two or more datasets
 */

export interface VennDiagramProps {
  data: ReconcileTableMetrics;
  animation?: AnimationOptions<'euler'>['animation'];
}

export function VennDiagram({ data, animation = false }: VennDiagramProps) {
  ChartJS.register(
    VennDiagramChart,
    VennDiagramController,
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

export function getVennDiagramData(data: ReconcileTableMetrics): any {
  const { base_only, target_only, common } = data;

  return {
    labels: ['target', 'base', 'base ∩ target'],
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
export function getVennDiagramOptions(data: ReconcileTableMetrics): any {
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
