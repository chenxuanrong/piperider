import {
  FlexProps,
  Grid,
  GridItem,
  Flex,
  Text,
  Link,
  Icon,
} from '@chakra-ui/react';
import { BsChevronRight } from 'react-icons/bs';
import {
  TableWrapper,
  TableItemName,
} from '../TableList/TableListItemDecorations';

import { Selectable } from '../../../types';

import {
  tableListGridTempCols,
  tableListMaxWidth,
} from '../../../utils/layout';
import { CompTableColEntryItem } from '../../../utils/store';

interface Props extends Selectable {
  reconcileEntry?: CompTableColEntryItem;
  description?: string;
  onInfoClick: () => void;
}

export function ReconcileListItem({
  reconcileEntry,
  description,
  onSelect,
  ...props
}: Props & FlexProps) {
  const [baseName] = reconcileEntry || [];

  return (
    <TableWrapper>
      <Grid
        templateColumns={tableListGridTempCols}
        width={tableListMaxWidth}
        justifyItems="flex-start"
        position={'relative'}
        rowGap={3}
      >
        {/* 1st Row */}
        {/* table name */}
        <GridItem>
          <TableItemName
            name={baseName || ''}
            description={description}
            onInfoClick={() => {
              props.onInfoClick();
            }}
          />
        </GridItem>

        {/* base and target table name */}
        <GridItem>
          <Flex color="gray.500">
            <Text mr={4}>Base:</Text>
            {/* {singleOnly ? (
              <Text>
                {formatColumnValueWith(fallbackTable?.row_count, formatNumber)}
              </Text>
            ) : (
              <TableRowColDeltaSummary
                baseCount={tableValue?.base?.row_count}
                targetCount={tableValue?.target?.row_count}
              />
            )} */}
          </Flex>
        </GridItem>
        <GridItem>
          <Flex gap={2}>
            <Link
              onClick={(event) => {
                event.stopPropagation();
                // onSelect({ baseName, targetName });
              }}
            >
              <Icon
                data-cy="navigate-report-detail"
                position={'absolute'}
                right={0}
                ml={5}
                as={BsChevronRight}
                color="piperider.500"
              />
            </Link>
          </Flex>
        </GridItem>
        <GridItem />
        <GridItem colSpan={2}>
          <Flex color="gray.500">
            <Text mr={4}>Target: {}</Text>
          </Flex>
        </GridItem>
      </Grid>
    </TableWrapper>
  );
}
