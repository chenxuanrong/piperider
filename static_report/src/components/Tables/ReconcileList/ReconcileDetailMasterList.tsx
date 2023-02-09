import { Box, Flex, Select, Text, Icon } from '@chakra-ui/react';
import {
  Comparable,
  ReconcileColumnMetrics,
  ReconcileResults,
  Selectable,
} from '../../../types';
import { FiGrid } from 'react-icons/fi';
import { string } from 'zod';
import { ReconcileDetailListItem } from './ReconcileDetailListItem';

interface Props extends Selectable, Comparable {
  currentReconcile: string;
  currentRule: string;
  reconcileEntry: ReconcileResults;
  reconcileEntryList: ReconcileResults[];
  onNavBack?: () => void;
  onNavToTableDetail?: (reconcileName: string) => void;
  onToggleShowExtra?: () => void;
}

export function ReconcileDetailMasterList({
  reconcileEntryList = [],
  reconcileEntry,
  currentReconcile,
  currentRule,
  onSelect,
  onNavBack,
  onNavToTableDetail,
}: Props) {
  const { name, metadata, tables, columns } = reconcileEntry;
  const isActive = currentRule === '' && currentReconcile;
  console.log(`${currentReconcile}, ${currentRule}`);
  console.log(isActive);

  return (
    <Flex direction={'column'} position={'relative'} bg={'gray.50'}>
      <Box
        position={'sticky'}
        top={0}
        w={'100%'}
        p={3}
        pb={0}
        zIndex={150}
        bg={'inherit'}
      >
        {/* Selector - Reconciles List */}
        <Select
          mb={9}
          defaultValue={currentReconcile}
          onChange={(evt) => {
            if (evt.target.value === 'table-list' && onNavBack) {
              onNavBack();
            } else if (onNavToTableDetail) {
              onNavToTableDetail(evt.target.value);
            }
          }}
        >
          <option value={'table-list'}>← Show All Reconcile Reports</option>
          {reconcileEntryList.map((entry, index) => (
            <option value={entry.name} key={index}>
              {entry.name}
            </option>
          ))}
        </Select>
        {/* Header */}
        <Flex justifyContent={'space-between'} mb={2}>
          <Text color={'gray.500'} size={'md'}>
            Reconcile
          </Text>
        </Flex>
        <Flex
          top={0}
          p={3}
          mb={9}
          borderRadius={'lg'}
          cursor={'pointer'}
          justify={'space-between'}
          bg={isActive ? 'piperider.400' : 'inherit'}
          color={isActive ? 'white' : 'inherit'}
          _hover={{ bgColor: isActive ? 'piperider.500' : 'blackAlpha.50' }}
          onClick={() => {
            onSelect({ tableName: currentReconcile, columnName: '' });
          }}
        >
          <Flex alignItems={'center'} gap={2} fontSize={'sm'}>
            <Icon as={FiGrid} color={isActive ? 'white' : 'inherit'} />
            <Text noOfLines={1}>{currentReconcile}</Text>
          </Flex>
        </Flex>
        {/* Rules Header */}
        <Flex justifyContent={'space-between'} alignItems={'center'}>
          <Text fontSize={'md'} color={'gray.500'}>
            {Object.keys(reconcileEntry.columns).length} Rules
          </Text>
        </Flex>

        <Box minHeight={'65vh'} mt={2}>
          {/* Rule */}
          {Object.keys(reconcileEntry.columns).map((key, i) => {
            return (
              <Box key={key}>
                <ReconcileDetailListItem
                  isActive={key === currentRule}
                  ruleName={key}
                  reconcileName={currentReconcile}
                  schemaType={reconcileEntry.columns[key].generic_type}
                  onSelect={(data) => {
                    onSelect(data);
                  }}
                  p={3}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Flex>
  );

  /**
   * COmponents renders
   * dropdown search bar
   * Current reconcile rule name
   * All detailed column reconcile rule name
   * search icon
   */
}
