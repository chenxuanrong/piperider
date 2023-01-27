import {
  Divider,
  Flex,
  Grid,
  GridItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useLocalStorage } from 'react-use';
import { useDocumentTitle } from '../hooks';
import { useReportStore } from '../utils/store';

import { Main } from '../components/Common/Main';
import { DataCompositionWidget } from '../components/Widgets/DataCompositionWidget';
import { ChartTabsWidget } from '../components/Widgets/ChartTabsWidget';
import { ColumnDetailMasterList } from '../components/Columns/ColumnDetailMasterList/ColumnDetailMasterList';
import {
  allContentGridTempCols,
  borderVal,
  extraSpaceAllContentGridTempCols,
  mainContentAreaHeight,
} from '../utils/layout';
import { DataSummaryWidget } from '../components/Widgets/DataSummaryWidget';
import { QuantilesWidget } from '../components/Widgets/QuantilesWidget';
import { VennDiagramWidget, getIconForColumnType } from '../components';

import { RR_TYPE_LABEL, MASTER_LIST_SHOW_EXTRA } from '../utils';

import { ReconcileRuleHeader } from '../components/Tables/ReconcileRuleHeader';
import { ReconcileReportSchema } from '../types';

interface Props {
  data: ReconcileReportSchema;
  columnName: string;
  tableName: string;
  ruleName: string;
}

export default function RRColumnDetailsPage({
  data,
  columnName,
  tableName,
  ruleName,
}: Props) {
  useDocumentTitle('Reconcile Report: Table Column Details');
  const {
    base: { tables: baseTables },
    input: { tables: targetTables },
    reconcile: { tables: tablesReconciles, columns: columnsReconciles },
  } = data;

  const [, setLocation] = useLocation();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const isTableDetailsView = columnName.length === 0;
  const setReportData = useReportStore((s) => s.setReportRawData);
  const [showExtra] = useLocalStorage(MASTER_LIST_SHOW_EXTRA, '');
  const [extraSpace, setExtraSpace] = useState<boolean>(Boolean(showExtra));

  setReportData({
    base: data.base,
    input: data.input,
    reconcile: data.reconcile,
  });
  const {
    tableColumnsOnly = [],
    assertionsOnly,
    reconcileResult,
  } = useReportStore.getState();
  const currentTableEntry = tableColumnsOnly.find(
    ([tableKey]) => tableKey === tableName,
  );

  // const [, { base: baseTableColEntry, target: targetTableColEntry }, metadata] =
  //   currentTableEntry;

  const baseDataTable = baseTables[tableName];
  const targetDataTable = targetTables[tableName];
  const baseDataColumns = baseDataTable?.columns || {};
  const targetDataColumns = targetDataTable?.columns || {};

  const baseColumnDatum = baseDataColumns[columnName];
  const targetColumnDatum = targetDataColumns[columnName];
  const fallbackColumnDatum = targetColumnDatum || baseColumnDatum;
  const { type: baseType } = baseColumnDatum || {};
  const { type: targetType } = targetColumnDatum || {};

  const { backgroundColor, icon } = getIconForColumnType(fallbackColumnDatum);

  return (
    <Main isSingleReport={false} maxHeight={mainContentAreaHeight}>
      <Grid
        width={'inherit'}
        templateColumns={
          extraSpace ? extraSpaceAllContentGridTempCols : allContentGridTempCols
        }
      ></Grid>

      {/* Master Area */}
      <GridItem overflowY={'scroll'} maxHeight={mainContentAreaHeight}>
        {/* ReconcileRuleList */}
        <ReconcileRuleHeader
          title={ruleName}
          subtitle={'Table'}
          mb={5}
          infoTip={'empty description'}
        />
      </GridItem>
      {isTableDetailsView ? (
        <GridItem maxHeight={mainContentAreaHeight} overflowY={'auto'} p={10}>
          <TabList>
            <Tab>Overview</Tab>
            {/* <Tab>Assertions</Tab> */}
            <Tab>Schema</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ComparableGridHeader />
              <Grid>
                <VennDiagramWidget />
              </Grid>
            </TabPanel>
            <TabPanel>
              <ComparableGridHeader />
            </TabPanel>
            <TabPanel>
              <ComparableGridHeader />
            </TabPanel>
          </TabPanels>
        </GridItem>
      ) : (
        <Grid>
          <GridItem>
            <Text color="gray.500">{'details coming soon'}</Text>
          </GridItem>
        </Grid>
      )}
    </Main>
  );
}

function ComparableGridHeader() {
  return (
    <Grid templateColumns={'1fr 1fr'} mb={2} gap={10}>
      {['Base', 'Target'].map((v, i) => (
        <Flex key={i} alignItems={'center'} w={'100%'}>
          <Text
            fontWeight={'semibold'}
            fontSize={'2xl'}
            color={'gray.400'}
            w={'100%'}
          >
            {v}
          </Text>
        </Flex>
      ))}
    </Grid>
  );
}
