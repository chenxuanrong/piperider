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
};

interface Props {
  columnStats?: ColumnComparisonStatsSchema;
  hasAnimation?: boolean;
}

export interface ReconcileMetricsProps {
  name: string;
  firstSlot?: string | number;
  secondSlot?: string | number;
  firstSlotWidth?: string;
  secondSlotWidth?: string;
  metakey?: keyof ColumnComparisonStatsSchema;
}

export function ReconcileMetricsInfo({
  name,
  firstSlot,
  secondSlot,
  firstSlotWidth = '100px',
  secondSlotWidth = '100px',
  metakey,
  ...props
}: ReconcileMetricsProps & FlexProps) {
  const metaDescription = reconcileMetricsDescrption[metakey || ''];
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
      <ReconcileMetricsInfo
        name="Total"
        firstSlot="199660"
        secondSlot="100%"
        metakey="total"
        width={'100%'}
      />
      <ReconcileMetricsInfo
        name="Equal Case Insensitive"
        firstSlot="199660"
        secondSlot="100%"
        metakey="equal_case_insensitive"
        width={'100%'}
      />
      <ReconcileMetricsInfo
        name="Equal whitespace trimmed"
        firstSlot="5000"
        secondSlot="15.5%"
        metakey="equal_trim_whitespace"
        width={'100%'}
      />
    </>
  );
}
