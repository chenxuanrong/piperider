import { Divider, Text, Flex, FlexProps, Tooltip } from '@chakra-ui/react';
import { NO_VALUE } from '../Columns';

export interface ColumnComparisonStatsSchema {
  /**
   *  The total count of base value is equal to target value
   */
  equal?: number;
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
  equal: 'Base value equal to target value eaxctly',
  // case_insensitive_equal:
  //   'Comparison of string comparison in case insensitive mode',
  // trim_white_space_equal: 'Equal when white space is trimmed',
  not_comparable: 'Not comparable case e.g. null vesus value',
  total: 'Total records',
  equal_within_5_difference:
    'Numeric value comparison when absolute difference is within 5 perc of base value',
  equal_with_10_difference:
    'Numeric value comparison when absolute difference is within 10 perc of base value',
  equal_within_1_day_difference:
    'Date or datetime data when equal within 1 day',
  equal_within_1_week_difference:
    'Date or datetime data when equal within 1 week',
  equal_within_1_month_difference:
    'Date or datetime data when equal within 1 month',
  equal_case_insensitive: 'Equal when case insensitive',
  equal_trim_whitespace: 'Equal when white space is trimmed',
};

const reconcileMetricsSlug = {
  equal: 'Exactly Equal',
  not_comparable: 'Not Comparable',
  total: 'Total',
  equal_within_5_difference: 'Within 5% Difference',
  equal_within_10_difference: 'Within 10% Difference',
  equal_within_1_day_difference: 'Within 1 Day Difference',
  equal_within_1_week_difference: 'Within 1 Week Difference',
  equal_within_1_month_difference: 'Within 1 Month Difference',
  equal_case_insensitive: 'Equal Case Insensitive',
  equal_trim_whitespace: 'Equal Trim Whitespace',
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
  const slug = reconcileMetricsSlug[metaKey || ''];
  return (
    <Flex {...restProps} alignItems={'center'}>
      <Tooltip
        label={metaDescription}
        isDisabled={!Boolean(metaDescription)}
        placement={'top'}
      >
        <Text width={width || '12em'} fontWeight={700} fontSize={'sm'}>
          {slug}
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
