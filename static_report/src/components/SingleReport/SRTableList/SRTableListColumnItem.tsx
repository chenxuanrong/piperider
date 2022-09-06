import { Flex, Grid, GridItem, Icon, Text } from '@chakra-ui/react';

import { ColumnName } from '../../shared/Tables/TableList/ColumnName';
import { SRTableListAssertionsSummary } from './SRTableListAssertionsSummary';
import { HistogramChart } from '../../shared/Charts/HistogramChart';
import type {
  AssertionTest,
  ColumnSchema,
} from '../../../sdlc/single-report-schema';
import { FiChevronRight } from 'react-icons/fi';
import { Selectable } from '../../../types';

interface Props extends Selectable {
  name: string;
  columnDatum: ColumnSchema;
  tableName: string;
  icon: any;
  colAssertions: AssertionTest[] | undefined;
}
export function SRTableListColumnItem({
  name,
  icon,
  columnDatum,
  colAssertions,
  tableName,
  onSelect,
}: Props) {
  return (
    <Grid
      p={3}
      key={name}
      alignItems="center"
      templateColumns="207px 2.5fr 1fr 2rem"
      _hover={{ bgColor: 'gray.50', cursor: 'pointer' }}
      onClick={() => onSelect({ tableName, columnName: name })}
      data-cy="sr-table-list-column-item"
    >
      <GridItem>
        <ColumnName name={name} icon={icon} />
      </GridItem>

      <GridItem>
        <Flex width="calc(100% - 50px)" height="80px">
          <HistogramChart hideAxis data={columnDatum} />
        </Flex>
      </GridItem>

      <GridItem>
        {!colAssertions ? (
          <Text color="gray.500">No assertions</Text>
        ) : (
          <SRTableListAssertionsSummary assertions={colAssertions} />
        )}
      </GridItem>

      <GridItem>
        <Icon as={FiChevronRight} color="piperider.500" boxSize={6} />
      </GridItem>
    </Grid>
  );
}
