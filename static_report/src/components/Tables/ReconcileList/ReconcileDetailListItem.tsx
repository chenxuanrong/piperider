import { Box, Flex, FlexProps, Text } from '@chakra-ui/react';
import { Comparable, ReconcileColumnMetrics, Selectable } from '../../../types';
import { ColumnName } from '../../Tables';
import { getIconForColumnType } from '../../Columns/utils';

interface Props extends Comparable, Selectable {
  reconcileName: string;
  ruleName: string;
  schemaType:
    | 'string'
    | 'numeric'
    | 'integer'
    | 'datetime'
    | 'boolean'
    | 'other';
  // ruleDefinition: ReconcileColumnMetrics;
  isActive: boolean;
}

export function ReconcileDetailListItem({
  reconcileName,
  ruleName,
  schemaType,
  onSelect,
  isActive,
  ...props
}: Props & FlexProps) {
  const { icon } = getIconForColumnType({ type: schemaType });
  return (
    <Flex
      mx={3}
      fontSize={'sm'}
      borderRadius={'lg'}
      justifyContent={'space-between'}
      alignItems={'center'}
      cursor={'pointer'}
      onClick={() => onSelect({ reconcileName, ruleName })}
      color={isActive ? 'white' : 'inherit'}
      bg={isActive ? 'piperider.400' : 'inherit'}
      _hover={{ bgColor: isActive ? 'piperider.500' : 'blackAlpha.50' }}
      data-cy="column-detail-list-item"
      {...props}
    >
      <ColumnName
        iconColor={isActive ? 'white' : 'gray.500'}
        icon={icon}
        name={ruleName}
      />
    </Flex>
  );
}
