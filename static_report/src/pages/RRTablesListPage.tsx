import { TableActionBar, TableListItem } from '../components';
import { Main } from '../components/Common/Main';
import { ComparisonReportSchema, ReconcileReportSchema } from '../types';

import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Flex, Text, Grid, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { useLocation } from 'wouter';

import { tableListGridTempCols, tableListWidth } from '../utils/layout';
import { useReportStore } from '../utils/store';
import { TableColumnSchemaList } from '../components/Tables/TableList/TableColumnSchemaList';
import { CommonModal } from '../components/Common/CommonModal';
import { useAmplitudeOnMount } from '../hooks';
import { AMPLITUDE_EVENTS, CR_TYPE_LABEL } from '../utils';

type Props = { data: ReconcileReportSchema };

export function RRTablesListPage({ data }: Props) {
  useDocumentTitle('Reconcile Report: Tables');
  useAmplitudeOnMount({
    eventName: AMPLITUDE_EVENTS.PAGE_VIEW,
    eventProperties: {
      type: CR_TYPE_LABEL,
      page: 'table-list-page',
    },
  });
  const modal = useDisclosure();
  const [tableColsEntryId, setTableColsEntryId] = useState(-1);
  const [, setLocation] = useLocation();
  const setReportData = useReportStore((s) => s.setReportRawData);
  setReportData({
    profiling: data.profiling,
    reconcile: data.reconcile,
    created_at: data.created_at,
    project: data.project,
    description: data.description,
  });
  const { reconcileResults, assertionsOnly } = useReportStore.getState();
  const { title, reconcile } = reconcileResults;

  return (
    <Main isSingleReport={false}>
      <TableActionBar />
      <Flex direction="column" width={tableListWidth} minHeight="650px" pt={9}>
        <Grid templateColumns={tableListGridTempCols} px={4} my={6}>
          <Text>Name</Text>
          <Text>Summary</Text>
        </Grid>

        {/* <Flex key={reconcileResults.title}>
          <TableListItem
            combinedAssertions={assertionsOnly}
            reconcileListEntry={reconcileResults}
            onSelect={() =>
              setLocation(`/reconciles/${reconcileResults.title}/rules/`)
            }
            onInfoClick={() => {
              setTableColsEntryId(reconcileResults.title);
              modal.onOpen();
            }}
          />
        </Flex> */}

        {reconcile.map((reconcileEntry, i) => {
          console.log(reconcileEntry);
          return (
            <Flex key={i}>
              <TableListItem
                combinedAssertions={assertionsOnly}
                reconcileListEntry={reconcileEntry}
                onSelect={() =>
                  setLocation(`/reconciles/${reconcileEntry.name}/rules/`)
                }
                onInfoClick={() => {
                  setTableColsEntryId(reconcileEntry.name);
                  modal.onOpen();
                }}
              />
            </Flex>
          );
        })}
      </Flex>

      <CommonModal
        {...modal}
        size="2xl"
        title={
          tableColsEntryId !== -1 && reconcileResults[tableColsEntryId].name
        }
        onClose={() => {
          setTableColsEntryId(-1);
          modal.onClose();
        }}
      >
        <Text fontSize="lg" mb={4}>
          Description:{' '}
          {(tableColsEntryId !== -1 &&
            reconcileResults[tableColsEntryId].metadata?.description) ?? (
            <Text as="i">No description provided.</Text>
          )}
        </Text>
        {/* todo: show a summary of reconcile? */}
        {/* {tableColsEntryId !== -1 && (
          <TableColumnSchemaList
            baseTableEntryDatum={reconcileResults[tableColsEntryId][1].base}
            targetTableEntryDatum={reconcileResults[tableColsEntryId][1].target}
          />
        )} */}
      </CommonModal>
    </Main>
  );
}
