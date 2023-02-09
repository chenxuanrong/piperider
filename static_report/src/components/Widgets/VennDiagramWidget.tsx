import { Divider, Text, Box, Flex } from '@chakra-ui/react';
import { AnimationOptions } from 'chart.js';

import { renderChartUnavailableMsg } from '../Charts/utils';
import { VennDiagram } from '../Charts';
import { ReconcileTableMetrics } from '../../types';

export interface VennChartProps {
  vennChartData: ReconcileTableMetrics;
  animation?: AnimationOptions<'venn'>['animation'];
}

export function VennDiagramWidget({ vennChartData }: VennChartProps) {
  return (
    <Box bg={'gray.50'} minWidth={'0px'}>
      <Text fontSize={'xl'}>Venn Diagram</Text>
      <Divider my={3} />
      {vennChartData ? (
        <>
          <Box my={5}>
            <VennDiagram data={vennChartData} />
          </Box>
        </>
      ) : (
        renderChartUnavailableMsg({})
      )}
    </Box>
  );
}
