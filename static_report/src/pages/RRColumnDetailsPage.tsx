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
import {
  allContentGridTempCols,
  borderVal,
  extraSpaceAllContentGridTempCols,
  mainContentAreaHeight,
} from '../utils/layout';
import { DataSummaryWidget } from '../components/Widgets/DataSummaryWidget';
import { QuantilesWidget } from '../components/Widgets/QuantilesWidget';
import { ChartTabsWidget } from '../components/Widgets/ChartTabsWidget';
import {
  DataCompositionWidget,
  TableColumnHeader,
  TableOverview,
  VennDiagramWidget,
  containsColumnQuantile,
  containsDataSummary,
  getIconForColumnType,
} from '../components';

import { MASTER_LIST_SHOW_EXTRA } from '../utils';

import { ReconcileRuleHeader } from '../components/Tables/ReconcileRuleHeader';
import { ReconcileColumnMetrics, ReconcileReportSchema } from '../types';
import { ReconcileDetailMasterList } from '../components/Tables/ReconcileList/ReconcileDetailMasterList';
import { ColumnComparisonStatsWidgets } from '../components/Widgets/ColumnComparisonStatsWidget';

interface Props {
  data: ReconcileReportSchema;
  reconcileName: string;
  ruleName: string;
}

export default function RRColumnDetailsPage({
  data,
  ruleName,
  reconcileName,
}: Props) {
  useDocumentTitle('Reconcile Report: Table Details');
  const {
    profiling: { base: baseTables, target: targetTables },
    reconcile,
  } = data;

  const [, setLocation] = useLocation();
  const [tableIndex, setTabIndex] = useState<number>(0);
  const isTableDetailsView = ruleName.length === 0;
  const setReportData = useReportStore((s) => s.setReportRawData);
  const [showExtra] = useLocalStorage(MASTER_LIST_SHOW_EXTRA, '');
  const [extraSpace, setExtraSpace] = useState<boolean>(Boolean(showExtra));

  setReportData({
    // base: baseTables,
    // target: targetTables,
    profiling: data.profiling,
    reconcile: data.reconcile,
    project: data.project,
    created_at: data.created_at,
    description: data.description,
  });
  const { reconcileResults } = useReportStore.getState();
  const reconcileEntries = reconcileResults.reconcile;
  const currentReconcileEntry = reconcileEntries?.find(
    (entry) => entry.metadata.name === reconcileName,
  );
  // const currentReconcileEntry = reconcileResults;

  const description = currentReconcileEntry?.metadata.description;
  const baseTableName = currentReconcileEntry?.metadata.base_table || '';
  const targetTableName = currentReconcileEntry?.metadata.target_table || '';
  // const baseSource = currentReconcileEntry?.metadata.base_source || '';
  // const targetSource = currentReconcileEntry?.metadata.target_source || '';
  const baseDataTable = baseTables[baseTableName];
  const targetDataTable = targetTables[targetTableName];
  const baseDataColumns = baseDataTable?.columns || {};
  const targetDataColumns = targetDataTable?.columns || {};

  // if column rule is highlighted
  const currentReconcileRule = currentReconcileEntry?.columns[ruleName];
  console.log(ruleName);
  // console.log(currentReconcileEntry.columns);
  console.log(currentReconcileRule);

  let baseRuleColumnName = currentReconcileRule?.base_compare_key as string;
  let targetRuleColumnName = currentReconcileRule?.target_compare_key as string;

  const baseColumnDatum = baseDataColumns[baseRuleColumnName];
  const targetColumnDatum = targetDataColumns[targetRuleColumnName];
  const fallbackColumnDatum = targetColumnDatum || baseColumnDatum;
  const { type: baseType } = baseColumnDatum || {};
  const { type: targetType } = targetColumnDatum || {};

  const { backgroundColor, icon } = getIconForColumnType(fallbackColumnDatum);
  const tableMetrics = currentReconcileEntry?.tables;
  const columnMetrics = currentReconcileEntry.columns[ruleName];
  const transformColumnMetrics = (data: ReconcileColumnMetrics) => {
    if (data.generic_type === 'string') {
      let result;
      result = [
        {
          name: 'total',
          firstSlot: data.total,
          secondSlot: '-',
          metaKey: 'total',
        },
        {
          name: 'not comparable',
          firstSlot: data.not_comparable,
          secondSlot: '-',
          metaKey: 'not_comparable',
        },
        {
          name: 'common',
          firstSlot: data.common,
          secondSlot: '-',
          metaKey: 'common',
        },
        {
          name: 'equal',
          firstSlot: data.equal,
          secondSlot: data.equal_percentage,
          metaKey: 'equal',
        },
        {
          name: 'equal_case_insensitive',
          firstSlot: data.equal_case_insensitive,
          secondSlot: data.equal_case_insensitive_percentage,
          metaKey: 'equal_case_insensitive',
        },
        {
          name: 'equal_trim_whitespace',
          firstSlot: data.equal_trim_whitespace,
          secondSlot: data.equal_trim_whitespace_percentage,
          metaKey: 'equal_trim_whitespace',
        },
      ];
      return result;
    }
    if (data.generic_type === 'numeric' || data.generic_type === 'integer') {
      let result = [
        {
          name: 'total',
          firstSlot: data.total,
          secondSlot: '-',
          metaKey: 'total',
        },
        {
          name: 'not comparable',
          firstSlot: data.not_comparable,
          secondSlot: '-',
          metaKey: 'not_comparable',
        },
        {
          name: 'common',
          firstSlot: data.common,
          secondSlot: '-',
          metaKey: 'common',
        },
        {
          name: 'equal',
          firstSlot: data.equal,
          secondSlot: data.equal_percentage,
          metaKey: 'equal',
        },
        {
          name: 'equal_within_5_difference',
          firstSlot: data.equal_within_5_difference,
          secondSlot: data.equal_within_5_difference_percentage,
          metaKey: 'equal_within_5_difference',
        },
        {
          name: 'equal_within_10_difference',
          firstSlot: data.equal_within_10_difference,
          secondSlot: data.equal_within_10_difference_percentage,
          metaKey: 'equal_within_10_difference',
        },
      ];
      return result;
    }
    if (data.generic_type === 'datetime') {
      let result = [
        {
          name: 'total',
          firstSlot: data.total,
          secondSlot: '-',
          metaKey: 'total',
        },
        {
          name: 'not comparable',
          firstSlot: data.not_comparable,
          secondSlot: '-',
          metaKey: 'not_comparable',
        },
        {
          name: 'common',
          firstSlot: data.common,
          secondSlot: '-',
          metaKey: 'common',
        },
        {
          name: 'equal',
          firstSlot: data.equal,
          secondSlot: data.equal_percentage,
          metaKey: 'equal',
        },
        {
          name: 'equal_within_1_day_difference',
          firstSlot: data.equal_within_1_day_difference,
          secondSlot: data.equal_within_1_day_difference_percentage,
          metaKey: 'equal_within_1_day_difference',
        },
        {
          name: 'equal_within_1_week_difference',
          firstSlot: data.equal_within_1_week_difference,
          secondSlot: data.equal_within_1_week_difference_percentage,
          metaKey: 'equal_within_1_week_difference',
        },
        {
          name: 'equal_within_1_month_difference',
          firstSlot: data.equal_within_1_month_difference,
          secondSlot: data.equal_within_1_month_difference_percentage,
          metaKey: 'equal_within_1_month_difference',
        },
      ];
      return result;
    }
    if (data.generic_type === 'boolean') {
      let result = [
        {
          name: 'total',
          firstSlot: data.total,
          secondSlot: '-',
          metaKey: 'total',
        },
        {
          name: 'not comparable',
          firstSlot: data.not_comparable,
          secondSlot: '-',
          metaKey: 'not_comparable',
        },
        {
          name: 'common',
          firstSlot: data.common,
          secondSlot: '-',
          metaKey: 'common',
        },
        {
          name: 'equal',
          firstSlot: data.equal,
          secondSlot: data.equal_percentage,
          metaKey: 'equal',
        },
      ];
      return result;
    }
  };

  return (
    <Main isSingleReport={false} maxHeight={mainContentAreaHeight}>
      <Grid
        width={'inherit'}
        templateColumns={
          extraSpace ? extraSpaceAllContentGridTempCols : allContentGridTempCols
        }
      >
        {/* Master Area */}
        <GridItem overflowY={'scroll'} maxHeight={mainContentAreaHeight}>
          {/* ReconcileRuleList */}
          <ReconcileDetailMasterList
            reconcileEntryList={reconcile}
            reconcileEntry={currentReconcileEntry!}
            currentReconcile={reconcileName}
            currentRule={ruleName}
            onSelect={({ reconcileName, ruleName }) => {
              setTabIndex(0);
              setLocation(`/reconciles/${reconcileName}/rules/${ruleName}`);
            }}
            onNavBack={() => {
              setLocation('/');
            }}
            onNavToTableDetail={(entry) => {
              setLocation(`/reconciles/${entry}/rules/`);
            }}
            onToggleShowExtra={() => setExtraSpace((v) => !v)}
          />
        </GridItem>
        {/* Detail Area - Rule Details */}
        {isTableDetailsView ? (
          <GridItem maxHeight={mainContentAreaHeight} overflowY={'auto'} p={10}>
            <ReconcileRuleHeader
              title={reconcileName}
              subtitle={'Reconcile'}
              mb={5}
              infoTip={description}
            />
            <Tabs defaultIndex={0}>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Assertions</Tab>
                <Tab>Schema</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <ComparableGridHeader />
                  <Grid templateColumns={'1fr 1px 1fr'} gap={3} p={5}>
                    <Flex flexDirection={'row'} alignItems={'center'}>
                      <Text
                        width={'8em'}
                        align={'left'}
                        fontSize={'sm'}
                        fontWeight={'700'}
                      >
                        Table
                      </Text>
                      <Text textAlign={'right'} fontSize={'sm'} width={'100%'}>
                        base_source.{baseTableName}
                      </Text>
                    </Flex>
                    <Divider orientation="vertical" />
                    <Flex flexDirection={'row'} alignItems={'center'}>
                      <Text
                        width={'8em'}
                        align={'left'}
                        fontSize={'sm'}
                        fontWeight={'700'}
                      >
                        Table
                      </Text>
                      <Text textAlign={'right'} fontSize={'sm'} width={'100%'}>
                        target_source.{baseTableName}
                      </Text>
                    </Flex>
                  </Grid>
                  <Grid templateColumns={'1fr 1px 1fr'} gap={3}>
                    <TableOverview
                      tableDatum={baseDataTable}
                      showDups={false}
                    />
                    <Divider orientation="vertical" />
                    <TableOverview
                      tableDatum={targetDataTable}
                      showDups={false}
                    />
                  </Grid>
                  <Grid templateColumns={'1fr'}>
                    {/* <Text align={'center'} fontSize={'xl'}>
                      Venn Diagram will show here
                    </Text> */}
                    <VennDiagramWidget vennChartData={tableMetrics} />
                  </Grid>
                </TabPanel>
                <TabPanel>
                  <Text> No Assertsion </Text>
                </TabPanel>
                <TabPanel>
                  <Text> No information </Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </GridItem>
        ) : (
          <Grid
            templateColumns={'1fr 1fr'}
            width={'100%'}
            maxHeight={mainContentAreaHeight}
            overflowY={'auto'}
          >
            <GridItem colSpan={2} rowSpan={2} p={9}>
              <TableColumnHeader
                title={ruleName}
                subtitle={ruleName}
                infoTip={currentReconcileRule?.generic_type}
                mb={5}
                borderBottom={borderVal}
                icon={icon}
                iconColor={backgroundColor}
              />
              <ComparableGridHeader />
              <Grid templateColumns={'1fr 1px 1fr'} gap={3} p={5}>
                <Flex flexDirection={'row'} alignItems={'center'}>
                  <Text
                    width={'8em'}
                    align={'left'}
                    fontSize={'sm'}
                    fontWeight={'700'}
                  >
                    Column
                  </Text>
                  <Text textAlign={'right'} fontSize={'m'} width={'75%'}>
                    {currentReconcileRule?.base_compare_key}
                  </Text>
                  <Text textAlign={'right'} fontSize={'m'} width={'25%'}>
                    {currentReconcileRule?.generic_type}
                  </Text>
                </Flex>
                <Divider orientation="vertical" />
                <Flex flexDirection={'row'} alignItems={'center'}>
                  <Text
                    width={'8em'}
                    align={'left'}
                    fontSize={'sm'}
                    fontWeight={'700'}
                  >
                    Column
                  </Text>
                  <Text textAlign={'right'} fontSize={'m'} width={'75%'}>
                    {currentReconcileRule?.target_compare_key}
                  </Text>
                  <Text textAlign={'right'} fontSize={'m'} width={'25%'}>
                    {currentReconcileRule?.generic_type}
                  </Text>
                </Flex>
              </Grid>
            </GridItem>
            {/* Data Composition Block */}
            <GridItem colSpan={2} px={9} py={2} bg={'gray.50'}>
              <Grid templateColumns={'1fr 1fr'} gap={8} minWidth={0}>
                <DataCompositionWidget columnDatum={baseColumnDatum} />
                <DataCompositionWidget columnDatum={targetColumnDatum} />
              </Grid>
            </GridItem>
            {/* Data Summary Block */}
            {(containsDataSummary(baseType) ||
              containsDataSummary(targetType)) && (
              <GridItem
                colSpan={2}
                gridRow={'span 1'}
                px={9}
                py={2}
                bg={'gray.50'}
              >
                <Grid templateColumns={'1fr 1fr'} gap={8}>
                  {<DataSummaryWidget columnDatum={baseColumnDatum} />}
                  {<DataSummaryWidget columnDatum={targetColumnDatum} />}
                </Grid>
              </GridItem>
            )}
            {/* Quantiles Block */}
            {(containsColumnQuantile(baseType) ||
              containsColumnQuantile(targetType)) && (
              <GridItem colSpan={2} gridRow={'span 1'} p={9} bg={'gray.50'}>
                <Grid templateColumns={'1fr 1fr'} gap={8}>
                  <QuantilesWidget columnDatum={baseColumnDatum} />
                  <QuantilesWidget columnDatum={targetColumnDatum} />
                </Grid>
              </GridItem>
            )}
            <GridItem
              colSpan={2}
              gridRow={'span 1'}
              // rowSpan={hasQuantile ? 3 : 2}
              minWidth={0}
              px={10}
              py={4}
              bg={'gray.50'}
            >
              <Grid templateColumns={'1fr 1fr'} gap={8}>
                <ChartTabsWidget
                  baseColumnDatum={baseColumnDatum}
                  hasAnimation
                  tabIndex={tableIndex}
                  onSelectTab={(i) => setTabIndex(i)}
                />
                <ChartTabsWidget
                  baseColumnDatum={targetColumnDatum}
                  hasAnimation
                  tabIndex={tableIndex}
                  onSelectTab={(i) => setTabIndex(i)}
                />
              </Grid>
            </GridItem>
            {/* Reconcile Stats Block */}
            <GridItem colSpan={2} gridRow={'span 1'} p={9} bg={'gray.50'}>
              <Grid templateColumns={'1fr 1fr'} gap={8}>
                <ColumnComparisonStatsWidgets
                  columnStats={transformColumnMetrics(columnMetrics)}
                  hasAnimation={false}
                />
              </Grid>
            </GridItem>
          </Grid>
        )}
      </Grid>
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
