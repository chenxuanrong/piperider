import { Flex, Heading, Button } from '@chakra-ui/react';
import { Link } from 'wouter';

import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function NewFeature() {
  useDocumentTitle('New Feature in progressing');

  return (
    <Flex
      direction="column"
      width="100%"
      minH="100vh"
      justifyContent="center"
      alignItems="center"
    >
      <Heading fontSize="3xl">New Feature in development 🚀</Heading>
      <Button mt={4}>
        <Link href="/">Back to Home</Link>
      </Button>
    </Flex>
  );
}
