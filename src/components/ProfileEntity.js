import React from 'react';
import {Avatar, Box, Heading, HStack, Text} from '@chakra-ui/react';
import useDarkMode from 'use-dark-mode';

const ProfileEntity = ({index,imgUrl,name,price}) => {

  const {value} = useDarkMode();

  return (
    <HStack spacing={4} display={'flex'} alignItems={'center'}>

      {/*  NUMBER CONTAINER*/}
      <Box>
        {index}
      </Box>

      {/*  AVATAR CONTAINER*/}
      <Box pos={'relative'}>
        <Avatar src={imgUrl} name={name} size={'md'} />
      </Box>

      {/*  NAME AND PRICE CONTAINER*/}

      <Box>
        <Heading fontFamily={'archia,sans-serif'} fontWeight={'bold'} fontSize={'1.1rem !important'} as={'h4'}>
          {name}
        </Heading>

        <Text mt={'2px'} color={'gray.500'} fontSize={'12px !important'} fontWeight={600}>
          {price}
        </Text>

      </Box>

    </HStack>
  );
};

export default ProfileEntity;