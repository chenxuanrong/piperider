import { Divider, Text, Box, Flex, FlexProps, Tooltip } from '@chakra-ui/react';
import { SubTitle } from 'chart.js';
import { renderChartUnavailableMsg } from '../Charts/utils';
import { NO_VALUE } from '../Columns';

export interface ColumnComparisonStatsSchema {
  /**
   *  The total count of base value is equal to target value
   */
  exactly_equal?: number;
  case_insensitive_equal?: number;
  trim_white_space_equal?: number;
  not_comparable?: number;
  total?: number;
  with_5_perc_differnce?: number;
  with_10_perc_differnce?: number;
  within_1_day_difference?: number;
  within_1_week_difference?: number;
  within_1_month_difference?: number;
  equal_case_insensitive?: number;
  equal_trim_whitespace?: number;
}

const reconcileMetricsDescrption = {
  exactly_equal: 'Count of base value exactly equal to target value',
  case_insensitive_equal:
    'Comparison of string comparison in case insensitive mode',
  trim_white_space_equal: 'Equal when white space is trimmed',
  not_comparable: 'Not comparable case e.g. null vesus value',
  total: 'Total records',
  with_5_perc_differnce:
    'Numeric value comparison when absolute difference is within 5 perc of base value',
  with_10_perc_differnce:
    'Numeric value comparison when absolute difference is within 10 perc of base value',
  within_1_day_difference: 'Date or datetime data when equal within 1 day',
  within_1_week_difference: 'Date or datetime data when equal within 1 week',
  within_1_month_difference: 'Date or datetime data when equal within 1 month',
  equal_case_insensitive: 'Equal when case insensitive',
  equal_trim_whitespace: 'Equal when white space is trimmed',
};

export interface MetricEntry {
  name: string;
  firstSlot?: string | number;
  secondSlot?: string | number;
  firstSlotWidth?: string;
  secondSlotWidth?: string;
  metaKey?: string;
}

interface Props {
  columnStats?: MetricEntry[];
  hasAnimation?: boolean;
}

export interface ReconcileMetricsProps {
  name: string;
  firstSlot?: string | number;
  secondSlot?: string | number;
  firstSlotWidth?: string;
  secondSlotWidth?: string;
  metaKey?: string;
}

export function ReconcileMetricsInfo({
  name,
  firstSlot,
  secondSlot,
  firstSlotWidth = '100%',
  secondSlotWidth = '100%',
  metaKey,
  ...props
}: ReconcileMetricsProps & FlexProps) {
  const metaDescription = reconcileMetricsDescrption[metaKey || ''];
  const { width, ...restProps } = props;
  const isTargetNull = secondSlot === null;
  return (
    <Flex {...restProps} alignItems={'center'}>
      <Tooltip
        label={metaDescription}
        isDisabled={!Boolean(metaDescription)}
        placement={'top'}
      >
        <Text width={width || '8em'} fontWeight={700} fontSize={'sm'}>
          {name}
        </Text>
      </Tooltip>
      <Flex gap={{ lg: 5, md: 1 }} flexDirection={'row'}></Flex>
      <Text textAlign="right" fontSize={'sm'} width={firstSlotWidth}>
        {firstSlot || NO_VALUE}
      </Text>

      {(secondSlot || isTargetNull) && (
        <Text textAlign="right" fontSize={'sm'} width={secondSlotWidth}>
          {secondSlot || NO_VALUE}
        </Text>
      )}
    </Flex>
  );
}

export function ColumnComparisonStatsWidgets({
  columnStats,
  hasAnimation,
}: Props) {
  return (
    <>
      <Text fontSize={'xl'}>Reconcile Statistics</Text>
      <Divider my={3} />
      {columnStats?.map(({ firstSlot, secondSlot, metaKey, name }, i) => {
        return (
          <ReconcileMetricsInfo
            key={i}
            name={name}
            firstSlot={firstSlot}
            secondSlot={secondSlot}
            metaKey={metaKey}
          />
        );
      })}
    </>
  );
}
