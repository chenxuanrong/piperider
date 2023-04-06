import { Flex, Text, Icon, Tooltip } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { FiDatabase, FiAlertCircle } from 'react-icons/fi';
import { NO_VALUE } from '../Columns';
import { useReportStore } from '../../utils/store';

type Props = {
  children?: ReactNode;
};

export function TableActionBar({ children }: Props) {
  const { reportOnly, reconcileResults } = useReportStore.getState();
  console.log(reconcileResults);
  let header;
  let label;
  if (!reconcileResults) {
    header = reportOnly?.base?.datasource.name || NO_VALUE;
    label = reportOnly?.base?.datasource.type || NO_VALUE;
  } else {
    header = reconcileResults.title;
    label = reconcileResults.description;
    console.log(reconcileResults);
  }

  return (
    <Flex
      alignSelf="flex-start"
      justifyContent="space-between"
      width="100%"
      p={4}
      borderBottom="1px solid"
      borderBottomColor="gray.300"
    >
      <Flex gap={1} alignItems="center">
        <Icon as={FiDatabase} mr={2} />
        <Text fontSize="large">{header}</Text>
        <Tooltip
          label={label}
          prefix=""
          placement="right-end"
          shouldWrapChildren
        >
          <Flex alignItems={'center'}>
            <Icon as={FiAlertCircle} />
          </Flex>
        </Tooltip>
      </Flex>

      {children}
    </Flex>
  );
}
