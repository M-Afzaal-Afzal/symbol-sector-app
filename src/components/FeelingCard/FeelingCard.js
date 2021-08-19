import React, {useEffect, useState} from 'react';
import {Box, Divider, Heading, HStack, Text} from '@chakra-ui/react';
import {FaChevronDown} from 'react-icons/fa';
// import {SiIconify} from 'react-icons/si';
import ProfileEntity from '../ProfileEntity';
import Sad from './sad.svg';
import HaHa from './haha.svg';
import useDarkMode from 'use-dark-mode';
import {useParams} from 'react-router-dom';
import {client} from '../../client';
import {Button} from '@material-ui/core';
import {useFirestore, useFirestoreDocData} from 'reactfire';

const FeelingCard = () => {

  const stateCode = useParams()?.stateCode?.toUpperCase() || '';

  const {value} = useDarkMode();

  const [reaction, setReaction] = useState(localStorage.getItem('reaction'));

  const [reactionToState, setReactionToState] = useState(localStorage.getItem(`${stateCode}reaction`));

  const [selectedTopVolumeData, setSelectedTopVolumeData] = useState([]);

  const reactionDate = localStorage.getItem('rcDate');

  const reactionToStateDate = localStorage.getItem(`${stateCode}rcDate`);

  const today = new Date();

  const fullDate = today.toISOString().split('T')[0];

  const time = today.getTime();

  const todayDate = today.getDate();

  const [isDaysVisible, setIsDaysVisible] = useState(false);
  const [isVolumesVisible, setIsVolumesVisible] = useState(false);

  const daysVisibleHandler = () => {
    setIsDaysVisible(!isDaysVisible);
    setIsVolumesVisible(false);
  };

  const volumesVisibleHandler = () => {
    setIsVolumesVisible(!isVolumesVisible);
    setIsDaysVisible(false);
  };

  const selectedNumberOfDaysArray = [1, 7, 14, 25, 30];
  const [availableVolumes, setAvailableVolumes] = useState([]);

  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedVolume, setSelectedVolume] = useState('');

  const [topVolumes, setTopVolumes] = useState({});

  const selectedDaysHandler = (days) => {
    setSelectedDays(days);
    setIsVolumesVisible(false);
    setIsDaysVisible(!isDaysVisible);

  };

  // Rating

  const selectedVolumesHandler = (volume) => {

    const structuredTopVolumeData = structureTopVolume(topVolumes[volume]);

    setSelectedTopVolumeData(structuredTopVolumeData);

    setSelectedVolume(volume);
    setIsDaysVisible(false);
    setIsVolumesVisible(!isVolumesVisible);
  };


  const token = localStorage.getItem('financeToken');
  const tokenExpiryTime = localStorage.getItem('tokenExpiryTime');

  const localStorageHandler = (reaction) => {
    const today = new Date();
    const date = today.getDate();
    localStorage.setItem('rcDate', `${date}`);
    localStorage.setItem('reaction', reaction);
  };

  const localStorageStateHandler = (reaction) => {
    const today = new Date();
    const date = today.getDate();
    localStorage.setItem(`${stateCode}rcDate`, `${date}`);
    localStorage.setItem(`${stateCode}reaction`, reaction);
  };

  const firestore = useFirestore();

  const overallRatingRef = firestore
    .collection('overallRating')
    .doc(fullDate);

  const {status: overallRatingStatus, data: overallRatingData} = useFirestoreDocData(overallRatingRef);

  const stateRatingRef = firestore
    .collection(`${stateCode}Rating`)
    .doc(fullDate);

  const {status: stateRatingStatus, data: stateRatingData} = useFirestoreDocData(stateRatingRef);

  // Calculating good percentages

  const [goodPercentage,setGoodPercentage] = useState(0)

  const [goodPercentageForState,setGoodPercentageForState] = useState(0)

  useEffect(() => {

    if(!goodPercentageForState && stateRatingData && stateCode) {
      const unitPercentageofState = 100 / (stateRatingData.happy + stateRatingData.sad);
      const goodPercentageForState = unitPercentageofState * stateRatingData.happy;
      setGoodPercentageForState(goodPercentageForState.toFixed(2));
    }

    if (!stateRatingData && overallRatingData) {
      // const unitPercentageOverall =
      const unitPercentageOverall = 100 / (overallRatingData.happy + overallRatingData.sad);
      const goodPercentageOverall = unitPercentageOverall * overallRatingData.happy;
      setGoodPercentage(goodPercentageOverall.toFixed(2));
    }

  },[goodPercentageForState,overallRatingData])

  // const goodPercentageForState = 88;

  // For overall rating
  const happyImageClickHandler = async () => {

    if (overallRatingStatus !== 'loading') {

      if (!overallRatingData) {
        firestore
          .collection('overallRating')
          .doc(fullDate).set({
          happy: 1,
          sad: 0,
        })
          .then((value) => {
            localStorageHandler('happy');
            setReaction('happy');
            console.log(value, 'Document updated successfully');
          });
      } else {

        firestore
          .collection('overallRating')
          .doc(fullDate)
          .set({
            happy: overallRatingData.happy + 1,
            sad: overallRatingData.sad,
          })
          .then((value) => {
            localStorageHandler('happy');
            setReaction('happy');
            console.log(value, 'Document updated successfully');
          });
      }

    }

  };


  const sadImageClickHandler = () => {


    if (overallRatingStatus !== 'loading') {

      if (!overallRatingData) {
        firestore
          .collection('overallRating')
          .doc(fullDate).set({
          happy: 0,
          sad: 1,
        })
          .then((value) => {
            localStorageHandler('sad');
            setReaction('sad');
            console.log(value, 'doc updated successfully');
          });
      } else {

        firestore
          .collection('overallRating')
          .doc(fullDate)
          .set({
            happy: overallRatingData.happy,
            sad: overallRatingData.sad + 1,
          })
          .then((value) => {
            // update the document if document is updated successfully
            localStorageHandler('sad');
            setReaction('sad');
            console.log('document updated successfully');

          });
      }

    }

  };

  const happyImageClickHandlerForState = () => {


    if (stateRatingStatus !== 'loading') {

      if (!stateRatingData) {
        firestore
          .collection(`${stateCode}Rating`)
          .doc(fullDate).set({
          happy: 1,
          sad: 0,
        })
          .then((value) => {
            localStorageStateHandler(`${stateCode}happy`);
            setReactionToState(`${stateCode}happy`);
            console.log(value, 'Document updated successfully');
          });
      } else {

        firestore
          .collection(`${stateCode}Rating`)
          .doc(fullDate).set({
            happy: overallRatingData.happy + 1,
            sad: overallRatingData.sad,
          })
          .then((value) => {
            localStorageStateHandler(`${stateCode}happy`);
            setReactionToState(`${stateCode}happy`);
            console.log(value, 'Document updated successfully');
          });
      }

    }

  };

  const sadImageClickHandlerForState = () =>  {


    if (stateRatingStatus !== 'loading') {

      if (!stateRatingData) {
        firestore
          .collection(`${stateCode}Rating`)
          .doc(fullDate).set({
          happy: 0,
          sad: 1,
        })
          .then((value) => {
            localStorageStateHandler(`${stateCode}sad`);
            setReactionToState(`${stateCode}sad`);
            console.log(value, 'Document updated successfully');
          });
      } else {

        firestore
          .collection(`${stateCode}Rating`)
          .doc(fullDate).set({
          happy: overallRatingData.happy,
          sad: overallRatingData.sad + 1,
        })
          .then((value) => {
            localStorageStateHandler(`${stateCode}sad`);
            setReactionToState(`${stateCode}sad`);
            console.log(value, 'Document updated successfully');
          });
      }

    }

  };

  const structureTopVolume = (volume) => {
    return Object.entries(volume).map(([key, value]) => {
      return {
        name: key,
        qty: value,
        imageUrl: `https://storage.googleapis.com/iex/api/logos/${key}.png`,
      };
    });
  };

  useEffect(() => {
    const reaction = localStorage.getItem('reaction');
    const reactionDate = localStorage.getItem('rcDate');

    console.log(reaction, reactionDate);

    if (!token || (token && time >= tokenExpiryTime)) {
      client.post('/auth/local', {
        identifier: 'Tradingbaseinc@gmail.com',
        password: 'Krishna@123',
      })
        .then((res) => {
          return res.data.jwt;
        })
        .then(token => {

          const date = new Date();

          const todayTime = date.getTime();

          const tokenExpiryTime = todayTime + 1.2096 * 10 ** 9;

          localStorage.setItem('financeToken', JSON.stringify(token));
          localStorage.setItem('expDateFinanceToken', JSON.stringify(tokenExpiryTime));

          return token;

        })
        .then(token => {

          client.get(`/options-flow-computed/topVolume?limit=6&days=${selectedDays}`, {
            headers: {
              Authorization: `bearer ${token}`,
            },
          })
            .then(res => {

              const topVolume = res.data;

              setTopVolumes(topVolume);

              console.log('top volumes are these', topVolume);

              const availableVolumes = Object.entries(topVolume).map(([key, value]) => {
                return key;
              });

              setAvailableVolumes(availableVolumes);

              console.log(availableVolumes, 'available volumes are there');

              if (!selectedVolume) {
                setSelectedVolume(availableVolumes[0]);
              }

              const selectedVolumeToShow = topVolume[availableVolumes[0]];

              const structuredSelectedTopVolume = structureTopVolume(selectedVolumeToShow);

              setSelectedTopVolumeData(structuredSelectedTopVolume);

              console.log(structuredSelectedTopVolume, 'this is top volume data to show');


            });

        })
        .catch(err => {
          console.log(err.message);
        });
    } else {

      client.get(`/options-flow-computed/topVolume?limit=6&days=${selectedDays}`, {
        headers: {
          Authorization: `bearer ${token}`,
        },
      })
        .then(res => {

          const topVolume = res.data;

          setTopVolumes(topVolume);

          console.log('top volumes are these', topVolume);

          const availableVolumes = Object.entries(topVolume).map(([key, value]) => {
            return key;
          });


          setAvailableVolumes(availableVolumes);

          console.log(availableVolumes, 'available volumes are there');

          if (!selectedVolume) {
            setSelectedVolume(availableVolumes[0]);
          }


          const selectedVolumeToShow = topVolume[availableVolumes[0]];

          const structuredSelectedTopVolume = structureTopVolume(selectedVolumeToShow);

          setSelectedTopVolumeData(structuredSelectedTopVolume);

          console.log(structuredSelectedTopVolume, 'this is top volume data to show');


        });
    }


  }, [selectedDays, tokenExpiryTime]);


  return (
    <Box>


      <Box py={'2rem'} px={'1rem'} w={'100%'} bg={value ? '#161625' : '#fff'}>
        {
          !stateCode && (
            (!reaction) || (reaction && reactionDate < todayDate) ? (
              <>
                <Heading fontFamily={'archia, sans-serif'} color={value ? '#fff' : 'gray.500'} fontWeight={400}
                         fontSize={'1.3rem !important'} textAlign={'center'}>
                  How do you feel about celsius network today?
                </Heading>

                <HStack justifyContent={'center'} mt={8} spacing={8}>
                  {/* Happy image icon*/}
                  <img
                    onClick={happyImageClickHandler}
                    style={{
                      width: '5rem', height: 'auto', cursor: 'pointer',
                    }} src={HaHa} alt='Happy icon'
                  />

                  {/* Sad image icon*/}
                  <img
                    onClick={sadImageClickHandler}
                    style={{
                      width: '5rem', height: 'auto',
                      cursor: 'pointer',
                    }} src={Sad} alt={'Sad Icon'}
                  />

                </HStack>
              </>
            ) : (

              <Box px={'1rem'}>

                <Box fontSize={'22px'} pb={'.4rem'} fontWeight={'bold'} color={value ? '' : ''}>
                  How You're doing
                </Box>


                <Divider height={'0'} bg={'#eee'} />

                <HStack spacing={6} mt={'1.5rem'}>

                  <Box>
                    {
                      reaction === 'happy' ? (
                        <img
                          style={{
                            width: '4rem', height: 'auto', cursor: 'pointer',
                          }} src={HaHa} alt='Happy icon'
                        />
                      ) : (
                        <img
                          style={{
                            width: '4rem', height: 'auto', cursor: 'pointer',
                          }} src={Sad} alt='Sad icon'
                        />
                      )
                    }

                  </Box>

                  <Divider orientation={'vertical'} width={'1px'} height={'4rem'} color={'#eee'} />

                  <Box>
                    <Box fontSize={'22px'}>
                      Could be better
                    </Box>
                    <Box>
                      You currently have {goodPercentage}% coverage
                    </Box>
                  </Box>

                </HStack>

                <Box py={'2rem'} mt={'1rem'}>

                  {
                    goodPercentage ? (
                      <Box height={'1rem'} py={'1rem'} pos={'relative'}>

                        <Box borderLeftRadius={'50px'} bg={'#9ACE46'} height={'100%'} pos={'absolute'} left={'0'} top={0}
                             width={`${goodPercentage}%`} />
                        {/*<Box bg={'#F7CA67'} height={'100%'} pos={'absolute'} left={'33.33%'} top={0} width={'33.33%'} />*/}
                        <Box borderRightRadius={'50px'} bg={'#FE5025'} height={'100%'} pos={'absolute'}
                             left={`${goodPercentage}%`} top={0}
                             width={`${100 - goodPercentage}%`} />

                        <Text pos={'absolute'} right={0} top={'-1.7rem'}>
                          Bad
                        </Text>

                        <Text pos={'absolute'} left={0} top={'-1.7rem'}>
                          Good
                        </Text>

                        <Text pos={'absolute'} left={0} bottom={'-1.7rem'}>
                          {goodPercentage}%
                        </Text>

                        <Text pos={'absolute'} right={0} bottom={'-1.7rem'}>
                          {100 - goodPercentage}%
                        </Text>

                      </Box>
                    ) : (
                      <Box>
                        Loading...
                      </Box>
                    )
                  }



                </Box>
              </Box>
            )
          )
        }

        {/*-------------------------------------------------*/}
        {/* ------------ for state is available ----------- */}
        {/*-------------------------------------------------*/}
        {
          stateCode && (
            (!reactionToState) || (reactionToState && reactionToStateDate < todayDate) ? (
              <>
                <Heading fontFamily={'archia, sans-serif'} color={value ? '#fff' : 'gray.500'} fontWeight={400}
                         fontSize={'1.3rem !important'} textAlign={'center'}>
                  How do you feel about celsius network today?
                </Heading>

                <HStack justifyContent={'center'} mt={8} spacing={8}>
                  {/* Happy image icon*/}
                  <img
                    onClick={happyImageClickHandlerForState}
                    style={{
                      width: '5rem', height: 'auto', cursor: 'pointer',
                    }} src={HaHa} alt='Happy icon'
                  />

                  {/* Sad image icon*/}
                  <img
                    onClick={sadImageClickHandlerForState}
                    style={{
                      width: '5rem', height: 'auto',
                      cursor: 'pointer',
                    }} src={Sad} alt={'Sad Icon'}
                  />

                </HStack>
              </>
            ) : (

              <Box px={'1rem'}>

                <Box fontSize={'22px'} pb={'.4rem'} fontWeight={'bold'} color={value ? '' : ''}>
                  How You're doing
                </Box>


                <Divider height={'0'} bg={'#eee'} />

                <HStack spacing={6} mt={'1.5rem'}>

                  <Box>
                    {
                      reaction === 'happy' ? (
                        <img
                          style={{
                            width: '4rem', height: 'auto', cursor: 'pointer',
                          }} src={HaHa} alt='Happy icon'
                        />
                      ) : (
                        <img
                          style={{
                            width: '4rem', height: 'auto', cursor: 'pointer',
                          }} src={Sad} alt='Sad icon'
                        />
                      )
                    }

                  </Box>

                  <Divider orientation={'vertical'} width={'1px'} height={'4rem'} color={'#eee'} />

                  <Box>
                    <Box fontSize={'22px'}>
                      Could be better
                    </Box>
                    <Box>
                      You currently have {goodPercentageForState}% coverage
                    </Box>
                  </Box>

                </HStack>

                <Box py={'2rem'} mt={'1rem'}>

                  {
                    goodPercentageForState  ? (
                      <Box height={'1rem'} py={'1rem'} pos={'relative'}>

                        <Box borderLeftRadius={'50px'} bg={'#9ACE46'} height={'100%'} pos={'absolute'} left={'0'} top={0}
                             width={`${goodPercentageForState}%`} />
                        {/*<Box bg={'#F7CA67'} height={'100%'} pos={'absolute'} left={'33.33%'} top={0} width={'33.33%'} />*/}
                        <Box borderRightRadius={'50px'} bg={'#FE5025'} height={'100%'} pos={'absolute'}
                             left={`${goodPercentageForState}%`} top={0}
                             width={`${100 - goodPercentageForState}%`} />

                        <Text pos={'absolute'} right={0} top={'-1.7rem'}>
                          Bad
                        </Text>

                        <Text pos={'absolute'} left={0} top={'-1.7rem'}>
                          Good
                        </Text>

                        <Text pos={'absolute'} left={0} bottom={'-1.7rem'}>
                          {goodPercentageForState}%
                        </Text>

                        <Text pos={'absolute'} right={0} bottom={'-1.7rem'}>
                          {100 - goodPercentageForState}%
                        </Text>

                      </Box>
                    ) : (
                      <Box>
                        Loading...
                      </Box>
                    )
                  }



                </Box>
              </Box>
            ))
        }


      </Box>

      <Box bg={!value ? '#F6F6F7' : '#161625'} py={'2rem'} px={'1.5rem'} w={'100%'}>
        <Heading fontFamily={'archia, sans-serif'} display={'flex'} alignItems={'center'} fontSize={'26px !important'}>
          Top&nbsp;
          <Box as={'button'}
               style={{
                 color: '#0066FF',
                 position: 'relative',
                 fontWeight: 'bold',
                 display: 'flex',
                 justifyContent: 'center',
               }}>
            {selectedVolume} <FaChevronDown onClick={volumesVisibleHandler}
                                            style={{marginTop: '1rem', marginLeft: '.3rem'}}
                                            size={15}
                                            color={'#0066FF'} />

            {
              isVolumesVisible && (
                <Box borderRadius={'lg'} top={50} left={'50%'} transform={'translateX(-50%)'}
                     bg={'#fff'} zIndex={100} pos={'absolute'} width={'11rem'}
                     padding={'1rem'}

                  // height={'10rem'}
                >
                  {
                    availableVolumes.map((volume, index) => (
                      <Button
                        borderRadius={'lg'}
                        onClick={selectedVolumesHandler.bind(this, volume)}
                        // bg={ }
                        fullWidth={true} key={index}
                        style={{
                          fontWeight: 'bold',
                          background: volume === selectedVolume ? '#eee' : '',
                        }}
                      >
                        {volume}
                      </Button>
                    ))
                  }

                </Box>

              )
            }

            &nbsp;
          </Box>
          in&nbsp;
          <Box as={'button'}
               style={{
                 color: '#0066FF',
                 position: 'relative',
                 fontWeight: 'bold',
                 display: 'flex',
                 justifyContent: 'center',
               }}
          >
            {selectedDays} day <FaChevronDown onClick={daysVisibleHandler}
                                              style={{marginTop: '1rem', marginLeft: '.3rem'}} size={15}
                                              color={'#0066FF'} />

            {/* days options buttons*/}

            {
              isDaysVisible && (
                <Box borderRadius={'lg'} top={50} left={'50%'} transform={'translateX(-50%)'}
                     bg={'#fff'} zIndex={100} pos={'absolute'} width={'11rem'}
                     padding={'1rem'}
                  // height={'10rem'}
                >
                  {
                    selectedNumberOfDaysArray.map((days, index) => (
                      <Button
                        borderRadius={'lg'}
                        onClick={selectedDaysHandler.bind(this, days)}
                        // bg={ }

                        fullWidth={true} key={index}
                        style={{
                          background: days === selectedDays ? '#eee' : '',
                          fontWeight: 'bold',
                        }}
                      >
                        {days}
                      </Button>
                    ))
                  }

                </Box>

              )
            }
          </Box>
          &nbsp;

        </Heading>

        <Box display={'grid'} gridRowGap={'2.3rem'} gridTemplateColumns={'1fr 1fr'} justifyItems={'start'} mt={'2rem'}>

          {/* SINGLE ENTITY*/}

          {
            selectedTopVolumeData.map(({name, imageUrl, qty}, index) => (
              <ProfileEntity
                index={index + 1}
                name={name}
                price={qty}
                imgUrl={imageUrl}
              />
            ))
          }

        </Box>

        {
          !selectedTopVolumeData.length && (
            <Text fontSize={'1.3rem'} textAlign={'center'}>
              Nothing is available in this range
            </Text>
          )
        }

      </Box>


    </Box>
  );
};

export default FeelingCard;