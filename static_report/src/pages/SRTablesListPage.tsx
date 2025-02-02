import { Flex, Text, Grid, useDisclosure } from '@chakra-ui/react';
import { useLocation } from 'wouter';
import { useState } from 'react';

import { Main } from '../components/Common/Main';
import { TableActionBar } from '../components/Tables/TableActionBar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

import { SaferSRSchema } from '../types';
import { TableListItem } from '../components/Tables/TableList/TableListItem';
import { tableListGridTempCols, tableListWidth } from '../utils/layout';
import { useReportStore } from '../utils/store';
import { TableColumnSchemaList } from '../components/Tables/TableList/TableColumnSchemaList';
import { useAmplitudeOnMount } from '../hooks/useAmplitudeOnMount';
import { AMPLITUDE_EVENTS, SR_TYPE_LABEL } from '../utils/amplitudeEvents';
import { CommonModal } from '../components/Common/CommonModal';

type Props = { data: SaferSRSchema };

export function SRTablesListPage({ data }: Props) {
  const modal = useDisclosure();
  const [tableColsEntryId, setTableColsEntryId] = useState(-1);
  const setReportData = useReportStore((s) => s.setReportRawData);
  setReportData({ base: data });
  const { tableColumnsOnly = [], assertionsOnly } = useReportStore.getState();

  const [, setLocation] = useLocation();

  useDocumentTitle('Single-Run Report: Tables');
  useAmplitudeOnMount({
    eventName: AMPLITUDE_EVENTS.PAGE_VIEW,
    eventProperties: {
      type: SR_TYPE_LABEL,
      page: 'table-list-page',
    },
  });

  return (
    <Main isSingleReport>
      <TableActionBar />
      <Flex direction="column" width={tableListWidth} minHeight="650px" pt={9}>
        <Grid templateColumns={tableListGridTempCols} px={4} my={6}>
          <Text>Name</Text>
          <Text>Summary</Text>
          <Text>Assertions</Text>
        </Grid>
        {tableColumnsOnly.map((tableColsEntry, i) => {
          return (
            <Flex key={i}>
              <TableListItem
                combinedAssertions={assertionsOnly}
                combinedTableEntry={tableColsEntry}
                singleOnly
                onInfoClick={() => {
                  setTableColsEntryId(i);
                  modal.onOpen();
                }}
                onSelect={({ tableName }) =>
                  setLocation(`/tables/${tableName}/columns/`)
                }
              />
            </Flex>
          );
        })}
      </Flex>

      <CommonModal
        {...modal}
        size="2xl"
        title={tableColsEntryId !== -1 && tableColumnsOnly[tableColsEntryId][0]}
        onClose={() => {
          setTableColsEntryId(-1);
          modal.onClose();
        }}
      >
        <Text fontSize="lg" mb={4}>
          Description:{' '}
          {(tableColsEntryId !== -1 &&
            tableColumnsOnly[tableColsEntryId][1].base?.description) ?? (
            <Text as="i">No description provided.</Text>
          )}
        </Text>
        {tableColsEntryId !== -1 && (
          <TableColumnSchemaList
            singleOnly
            baseTableEntryDatum={tableColumnsOnly[tableColsEntryId][1].base}
          />
        )}
      </CommonModal>
    </Main>
  );
}
