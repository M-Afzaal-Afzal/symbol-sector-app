import {
  API_DOMAIN,
  STATE_CODES_ARRAY,
  STATE_CODES,
  STATE_NAMES,
  UNASSIGNED_STATE_CODE,
  UNKNOWN_DISTRICT_KEY,
} from '../constants';

import produce from 'immer';
import {memo, useState, useEffect, useMemo, useCallback, useRef} from 'react';
import * as Icon from 'react-feather';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {useDebounce, useKeyPressEvent, useUpdateEffect} from 'react-use';
import {
  Button, Flex, Heading,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper, NumberInput,
  NumberInputField, Text,
  useDisclosure, VStack,
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  Radio,
  Stack,
  RadioGroup,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import {client} from '../client';

const suggestions = [
  'Madurai',
  'Karnataka',
  'Ladakh',
  'Mumbai',
  'Andhra Pradesh',
  'Alappuzha',
];

const districtSuggestions = [
  'Madurai',
  'Ganjam',
  'Alappuzha',
  'Mumbai',
  'Chennai',
];

const stateSuggestions = [
  'Andhra Pradesh',
  'Karnataka',
  'Gujarat',
  'West Bengal',
  'Ladakh',
];

function Search() {

  const pathname = window.location.pathname;

  const [trendingSymbolSuggestions,setTrendingSymbolSuggestions] = useState([]);
  const [trendingSectorSuggestions,setTrendingSectorSuggestions] = useState([]);
  const token = localStorage.getItem('financeToken');
  const tokenExpiryTime = localStorage.getItem('tokenExpiryTime');
  const today = new Date();
  const time = today.getTime();

  useEffect(() => {

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

          // getting the options flow summary

          client.get(`options-flow-summary-symbol?days=7&sort=totalpremium:desc`, {
            headers: {
              Authorization: `bearer ${token}`,
            },
          })
            .then(res => {
              const optionsFlowSummary = res.data;

              const trendingSymbolsSuggestions = Object.entries(optionsFlowSummary).map(([key,value]) => key).slice(0,6);

              setTrendingSymbolSuggestions(trendingSymbolsSuggestions);

            });

          // getting the options flow summary for sectors

          client.get(`options-flow-summary-sector?days=7&sort=totalpremium:desc&limit=6`, {
            headers: {
              Authorization: `bearer ${token}`,
            },
          })
            .then(res => {
              const optionsFlowSummary = res.data;

              const trendingSectorSuggestions = Object.entries(optionsFlowSummary).map(([key,value]) => key).slice(0,6);

              setTrendingSectorSuggestions(trendingSectorSuggestions);

            });

        })
        .catch(err => {
          console.log(err.message);
        });




    } else {

    }
  },[])

  console.log(pathname);

  const [searchValue, setSearchValue] = useState('');
  const [expand, setExpand] = useState(false);
  const [results, setResults] = useState([]);
  const searchInput = useRef(null);
  const {t} = useTranslation();

  const [engine, setEngine] = useState(null);
  const [districtEngine, setDistrictEngine] = useState(null);

  useUpdateEffect(() => {
    import('corejs-typeahead').then((Bloodhound) => {
      setEngine(
        // eslint-disable-next-line
        new Bloodhound.default({
          initialize: true,
          local: STATE_CODES_ARRAY.filter(
            ({code}) => code !== UNASSIGNED_STATE_CODE,
          ),
          queryTokenizer: Bloodhound.default.tokenizers.whitespace,
          datumTokenizer: Bloodhound.default.tokenizers.obj.whitespace('name'),
        }),
      );

      setDistrictEngine(
        // eslint-disable-next-line
        new Bloodhound.default({
          initialize: true,
          limit: 5,
          queryTokenizer: Bloodhound.default.tokenizers.whitespace,
          datumTokenizer:
            Bloodhound.default.tokenizers.obj.whitespace('district'),
          indexRemote: true,
          remote: {
            url: `${API_DOMAIN}/state_district_wise.json`,
            transform: function(response) {
              const districts = [];
              Object.keys(response)
                .filter((stateName) => stateName !== 'State Unassigned')
                .map((stateName) => {
                  const districtData = response[stateName].districtData;
                  Object.keys(districtData)
                    .filter(
                      (districtName) => districtName !== UNKNOWN_DISTRICT_KEY,
                    )
                    .map((districtName) => {
                      return districts.push({
                        district: districtName,
                        state: stateName,
                      });
                    });
                  return null;
                });
              return districts;
            },
          },
        }),
      );
    });
  }, [expand]);

  const handleSearch = useCallback(
    (searchInput) => {
      if (!engine) return null;
      const results = [];

      const sync = (datums) => {
        datums.map((result, index) => {
          const stateObj = {
            name: result.name,
            type: 'state',
            route: result.code,
          };
          results.push(stateObj);
          return null;
        });
      };

      const districtSync = (datums) => {
        datums.slice(0, 3).map((result, index) => {
          const districtObj = {
            name: result.district,
            type: 'district',
            route: STATE_CODES[result.state],
          };
          results.push(districtObj);
          return null;
        });

        setResults([...results]);
      };

      engine.search(searchInput, sync);
      districtEngine.search(searchInput, districtSync);
    },
    [districtEngine, engine],
  );

  useDebounce(
    () => {
      if (searchValue) {
        handleSearch(searchValue);
      } else {
        setResults(
          produce(results, (draftResults) => {
            draftResults.splice(0);
          }),
        );
      }
    },
    100,
    [searchValue],
  );

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value',
    ).set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else {
      valueSetter.call(element, value);
    }
  }

  const fillPlaceholder = useCallback(
    (target, index, cursorPosition, callback) => {
      if (expand) {
        target.textContent = '';
        return true;
      }
      const text = t(suggestions[index]);
      const placeholder = target.textContent;
      target.classList.remove('disappear');
      target.textContent = placeholder + text[cursorPosition];
      if (cursorPosition < text.length - 1) {
        setTimeout(function() {
          fillPlaceholder(target, index, cursorPosition + 1, callback);
        }, 200);
        return true;
      }
      callback();
    },
    [expand, t],
  );

  const clearPlaceholder = useCallback((target, callback) => {
    const placeholder = target.textContent;
    target.classList.add('disappear');
    if (placeholder.length > 0) {
      setTimeout(function() {
        target.textContent = '';
        clearPlaceholder(target, callback);
      }, 1000);
      return true;
    }
    callback();
  }, []);

  const loopThroughSuggestions = useCallback(
    (target, index) => {
      if (expand) {
        target.textContent = '';
        return true;
      }

      fillPlaceholder(target, index, 0, function() {
        setTimeout(function() {
          clearPlaceholder(target, function() {
            loopThroughSuggestions(target, (index + 1) % suggestions.length);
          });
        }, 2000);
      });
    },
    [clearPlaceholder, expand, fillPlaceholder],
  );

  useEffect(() => {
    if (!expand) {
      const targetInput =
        document.getElementsByClassName('search-placeholder')[0];

      if (targetInput) {
        loopThroughSuggestions(targetInput, 0);
      }
    }
  }, [expand, loopThroughSuggestions]);

  const trail = useMemo(() => {
    const styles = [];

    [0, 0, 0].map((element, index) => {
      styles.push({
        animationDelay: `${index * 250}ms`,
      });
      return null;
    });
    return styles;
  }, []);

  const handleClose = useCallback(() => {
    setSearchValue('');
    setResults([]);
  }, []);

  const handleChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  useKeyPressEvent('/', () => {
    searchInput.current.focus();
  });

  useKeyPressEvent('Escape', () => {
    handleClose();
    searchInput.current.blur();
  });

  const {isOpen, onOpen, onClose} = useDisclosure();

  const [daysOfExpiration, setDaysOfExpiration] = useState(1);
  const [usualActivity, setUsualActivity] = useState(false);
  const [weeklyOptions, setWeeklyOptions] = useState(false);

  const [priceRange, setPriceRange] = useState([0.3, 1.4]);
  const [premiumRange, setPremiumRange] = useState([100, 10000]);
  const [impliedVolatilityRange, setImpliedVolatilityRange] = useState([10, 100]);
  const [volumeRange, setVolumeRange] = useState([100, 1000]);
  const [marketCapRange, setMarketCapRange] = useState([100000, 1000000]);
  const [openInterestRange, setOpenInterestRange] = useState([100, 10000]);
  const [daysOfExpirationRange, setDaysOfExpirationRange] = useState([1, 30]);


  const mostlySearchedPriceRanges = [[0.3, 0.6], [0.6, 0.8], [0.8, 1.1], [1.1, 1.3], [0.3, 1.4], [0.3, 0.8]];
  const mostlySearchedPremiumRanges = [[100, 500], [500, 800], [800, 2500], [2500, 5000], [5000, 8000], [8000, 10000]];
  const mostlySearchedImpliedVolatilityRange = [[10, 20], [20, 30], [30, 50], [50, 70], [70, 80], [80, 100]];
  const mostlySearchedVolumeRange = [[100, 200], [200, 300], [300, 500], [500, 600], [600, 800], [800, 1000]];
  const mostlySearchedCapRange = [[100000, 150000], [150000, 250000], [250000, 350000], [350000, 550000], [550000, 850000], [850000, 1000000]];
  const mostlySearcheddaysOfExpirationRange = [[1, 3], [3, 7], [7, 15], [15, 30]];
  const mostlySearchedOpenInterestRange = [[100, 500], [500, 800], [800, 2500], [2500, 5000], [5000, 8000], [8000, 10000]];
  const [optionType, setOptionType] = useState('calls');
  const [optionsType, setOptionsType] = useState('sweeps');

  // SECOND PAGE ACCORDION CONFIG
  const [callVolumeRange, setCallVolumeRange] = useState([30, 60]);
  const [putVolumeRange, setPutVolumeRange] = useState([30, 60]);
  const [premiumCallRange, setPremiumCallRange] = useState([30, 60]);
  const [premiumPutRange, setPremiumPutRange] = useState([30, 60]);
  const [totalCountRange, setTotalCountRange] = useState([100, 1000]);
  const [premiumCallVolume, setPremiumCallVolume] = useState([100, 1000]);
  const [premiumPutVolume, setPremiumPutVolume] = useState([100, 1000]);

  // MOSTLY SEARCHED CONFIG FOR SECOND PAGE
  const mostlySearchedCAllVolumeRanges = [[30, 40], [40, 50], [50, 60], [30, 50], [30, 60], [40, 60]];
  const mostlySearchedPutVolumeRanges = [[30, 40], [40, 50], [50, 60], [30, 50], [30, 60], [40, 60]];
  const mostlySearchedPremiumCallRanges = [[30, 40], [40, 50], [50, 60], [30, 50], [30, 60], [40, 60]];
  const mostlySearchedPremiumPutRanges = [[30, 40], [40, 50], [50, 60], [30, 50], [30, 60], [40, 60]];
  const mostlySearchedtotalCountRanges = [[100, 200], [200, 300], [300, 500], [500, 700], [700, 850], [850, 1000]];
  const mostlySearchedPremiumCallVolumeRanges = [[100, 200], [200, 300], [300, 500], [500, 700], [700, 850], [850, 1000]];
  const mostlySearchedPremiumPutVolumeRanges = [[100, 200], [200, 300], [300, 500], [500, 700], [700, 850], [850, 1000]];

  // FIRST PAGE ACCORDION FUNCTIONS

  const onMinPriceChange = (val) => {
    setPriceRange((prevRange) => {
      return [val, prevRange[1]];
    });
  };

  const onMaxPriceChange = (val) => {
    setPriceRange((prevRange) => {
      return [prevRange[0], val];
    });
  };

  const onMinPremiumRangeChange = (val) => {
    setPremiumRange((prevPremiumRange) => {
      return [val, prevPremiumRange[1]];
    });
  };

  const onMaxPremiumRangeChange = (val) => {
    setPremiumRange((prevRange) => {
      return [prevRange[0], val];
    });
  };

  const onMinVolumeRangeChange = (val) => {
    setVolumeRange((prevVolume) => {
      return [val, prevVolume[1]];
    });
  };

  const onMaxImpliedVolatilityRangeChange = (val) => {
    setImpliedVolatilityRange((prevVolatility) => {
      return [prevVolatility[0], val];
    });
  };

  const onMinImpliedVolatilityRangeChange = (val) => {
    setImpliedVolatilityRange((prevVolatility) => {
      return [val, prevVolatility[1]];
    });
  };

  const onMinMarketCapRangeChange = (val) => {
    setMarketCapRange((marketCapRange) => {
      return [marketCapRange[0], val];
    });
  };

  const onMaxMarketCapRangeChange = (val) => {
    setMarketCapRange((marketCapRange) => {
      return [val, marketCapRange[1]];
    });
  };

  const onMinOpenInterestRangeChange = (val) => {
    setOpenInterestRange((openInterestRange) => {
      return [openInterestRange[0], val];
    });
  };

  const onMaxOpenInterestRangeChange = (val) => {
    setOpenInterestRange((openInterestRange) => {
      return [val, openInterestRange[1]];
    });
  };

  const onMinDaysOfExpirationRangeChange = (val) => {
    setDaysOfExpirationRange((daysOfExpiration) => {
      return [daysOfExpiration[0], val];
    });
  };

  const onMaxDaysOfExpirationRangeChange = (val) => {
    setDaysOfExpirationRange((daysOfExpiration) => {
      return [val, daysOfExpiration[1]];
    });
  };

  const onMaxVolumeRangeChange = (val) => {
    setVolumeRange((prevVolume) => {
      return [prevVolume[0], val];
    });
  };

  // 2ND PAGE ACCORDION FUNCTIONS

  // CALL VOLUME RANGE
  const onMinCallVolumeRangeChange = (val) => {
    setCallVolumeRange((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxCallVolumeRangeChange = (val) => {
    setCallVolumeRange((prevState) => {
      return [prevState[0],val];
    });
  };

  // PUT VOLUME RANGE
  const onMinPutVolumeRangeChange = (val) => {
    setPutVolumeRange((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxPutVolumeRangeChange = (val) => {
    setPutVolumeRange((prevState) => {
      return [prevState[0],val];
    });
  };

  // PremiumPutRangeChange RANGE
  const onMinPremiumPutRangeChange = (val) => {
    setPremiumPutRange((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxPremiumPutRangeChange = (val) => {
    setPremiumPutRange((prevState) => {
      return [prevState[0],val];
    });
  };

  // PREMIUM CALL RANGE
  const onMinPremiumCallRangeChange = (val) => {
    setPremiumCallRange((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxPremiumCallRangeChange = (val) => {
    setPremiumCallRange((prevState) => {
      return [prevState[0],val];
    });
  };

  // PREMIUM call Volume RANGE
  const onMinPremiumCallVolumeRangeChange = (val) => {
    setPremiumCallVolume((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxPremiumCallVolumeRangeChange = (val) => {
    setPremiumCallVolume((prevState) => {
      return [prevState[0],val];
    });
  };

  // PREMIUM put Volume RANGE
  const onMinPremiumPutVolumeRangeChange = (val) => {
    setPremiumPutVolume((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxPremiumPutVolumeRangeChange = (val) => {
    setPremiumPutVolume((prevState) => {
      return [prevState[0],val];
    });
  };


  // TOTAL COUNT RANGE
  const onMinTotalCountRangeChange = (val) => {
    setTotalCountRange((prevState) => {
      return [val, prevState[1]];
    });
  };

  const onMaxTotalCountRangeChange = (val) => {
    setTotalCountRange((prevState) => {
      return [prevState[0],val];
    });
  };



  return (
    <div className='Search'>
      <label className='fadeInUp' style={trail[0]}>
        {t('Search symbol or sector')}
      </label>
      <div className='line fadeInUp' style={trail[1]}></div>

      <div className='search-input-wrapper fadeInUp' style={trail[2]}>
        <input
          type='text'
          value={searchValue}
          ref={searchInput}
          onFocus={setExpand.bind(this, true)}
          onBlur={setExpand.bind(this, false)}
          onChange={handleChange}
        />

        {!expand && searchValue === '' && (
          <span className='search-placeholder'></span>
        )}

        <div className={`search-button`}>
          <Icon.Search />
        </div>

        <div onClick={onOpen} className={'add-filter-button'}>
          Add Filter
        </div>

        <Modal scrollBehavior={'inside'} isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />

          <ModalContent bg={'#171924'}>

            <ModalHeader borderBottom={'1px solid #21232F'} textAlign={'center'} color={'#fff'}>
              More Filters
            </ModalHeader>

            <ModalCloseButton color={'#515769'} />

            {
              pathname !== '/' ? (
                // FIRST PAGE ACCORDION / MODEL BODY
                <ModalBody color={'#fff'} pb={8} px={0} pt={0}>


                  <Accordion allowToggle>
                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Days to Expiration
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMaxDaysOfExpirationRangeChange} min={1} max={30}
                                       value={daysOfExpirationRange[0]}>
                            <NumberInputField placeholder={priceRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMinDaysOfExpirationRangeChange} min={daysOfExpirationRange[0]}
                                       max={30} value={daysOfExpirationRange[1]}>
                            <NumberInputField placeholder={daysOfExpirationRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Days of Expiration Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearcheddaysOfExpirationRange.map((daysRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(daysRange, 'Price Range');
                                setDaysOfExpirationRange(daysRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {daysRange[0]} to {daysRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>
                        {/*<RadioGroup onChange={setDaysOfExpiration} value={daysOfExpiration}>*/}
                        {/*  <Stack direction='row'>*/}
                        {/*    <Radio value='1'>1</Radio>*/}
                        {/*    <Radio value='3'>3</Radio>*/}
                        {/*    <Radio value='7'>7</Radio>*/}
                        {/*    <Radio value='15'>15</Radio>*/}
                        {/*    <Radio value='30'>30</Radio>*/}
                        {/*  </Stack>*/}
                        {/*</RadioGroup>*/}
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton display={'flex'} justifyContent={'space-between'}>
                          <Box flex='1' textAlign='left'>
                            Unusual Activity
                          </Box>

                          <Switch isChecked={usualActivity} onChange={() => {
                            setUsualActivity(!usualActivity);
                          }} />

                        </AccordionButton>
                      </h2>

                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            OptionType
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <RadioGroup
                          onChange={setOptionType}
                          value={optionType}
                        >
                          <VStack alignItems={'flex-start'}>
                            <Radio
                              value='calls'
                            >
                              Calls
                            </Radio>
                            <Radio
                              value='puts'
                            >
                              Puts
                            </Radio>
                          </VStack>
                        </RadioGroup>

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Options Type
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <RadioGroup
                          onChange={setOptionsType}
                          value={optionsType}
                        >
                          <VStack alignItems={'flex-start'}>
                            <Radio
                              value='sweeps'
                            >
                              Sweeps
                            </Radio>
                            <Radio
                              value='splits'
                            >
                              Splits
                            </Radio>
                            <Radio
                              value='blocks'
                            >
                              Block
                            </Radio>
                          </VStack>
                        </RadioGroup>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Price
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <HStack py={8}>

                          <NumberInput onChange={onMinPriceChange} min={0.3} max={1.4} value={priceRange[0]}>
                            <NumberInputField placeholder={priceRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxPriceChange} min={priceRange[0]} max={1.4} value={priceRange[1]}>
                            <NumberInputField placeholder={priceRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Price Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPriceRanges.map((priceRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(priceRange, 'Price Range');
                                setPriceRange(priceRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {priceRange[0]} to {priceRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                        {/*<Slider onChangeEnd={(val) => {*/}
                        {/*  setPrice((val/10))*/}
                        {/*  console.log(val/10);*/}
                        {/*}} min={3} max={14}>*/}
                        {/*  <SliderTrack bg="red.100">*/}
                        {/*    <Box position="relative" right={10} />*/}
                        {/*    <SliderFilledTrack bg="blue" />*/}
                        {/*  </SliderTrack>*/}
                        {/*  <SliderThumb boxSize={6} />*/}
                        {/*</Slider>*/}

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Premium Range
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <HStack py={8}>

                          <NumberInput min={100} max={10000} onChange={onMinPremiumRangeChange} value={premiumRange[0]}>
                            <NumberInputField placeholder={premiumRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput min={premiumRange[0]} max={10000} onChange={onMaxPremiumRangeChange}
                                       value={premiumRange[1]}>
                            <NumberInputField placeholder={premiumRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Price Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPremiumRanges.map((premiumRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(premiumRange, 'Premium Range');
                                setPremiumRange(premiumRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {premiumRange[0]} to {premiumRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                        {/*<Slider onChangeEnd={(val) => {*/}
                        {/*  setRange((val));*/}
                        {/*  console.log(val);*/}
                        {/*}} min={100} max={10000}>*/}
                        {/*  <SliderTrack bg='red.100'>*/}
                        {/*    <Box position='relative' right={10} />*/}
                        {/*    <SliderFilledTrack bg='blue' />*/}
                        {/*  </SliderTrack>*/}
                        {/*  <SliderThumb boxSize={6} />*/}
                        {/*</Slider>*/}
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Volume
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <HStack py={8}>

                          <NumberInput onChange={onMinVolumeRangeChange} min={100} max={1000} value={volumeRange[0]}>
                            <NumberInputField placeholder={priceRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxVolumeRangeChange} min={volumeRange[0]} max={1000}
                                       value={volumeRange[1]}>
                            <NumberInputField placeholder={volumeRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Volume Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedVolumeRange.map((volumeRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(volumeRange, 'Price Range');
                                setVolumeRange(volumeRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {volumeRange[0]} to {volumeRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                        {/*<Slider onChangeEnd={(val) => {*/}
                        {/*  setVolume((val));*/}
                        {/*  console.log(val);*/}
                        {/*}} min={100} max={1000}>*/}
                        {/*  <SliderTrack bg='red.100'>*/}
                        {/*    <Box position='relative' right={10} />*/}
                        {/*    <SliderFilledTrack bg='blue' />*/}
                        {/*  </SliderTrack>*/}
                        {/*  <SliderThumb boxSize={6} />*/}
                        {/*</Slider>*/}

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Implied Volatility
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <HStack py={8}>

                          <NumberInput onChange={onMinImpliedVolatilityRangeChange} min={10} max={100}
                                       value={impliedVolatilityRange[0]}>
                            <NumberInputField placeholder={impliedVolatilityRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxImpliedVolatilityRangeChange} min={impliedVolatilityRange[0]}
                                       max={100} value={impliedVolatilityRange[1]}>
                            <NumberInputField placeholder={impliedVolatilityRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Implied Volatility Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedImpliedVolatilityRange.map((volatilityRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(volatilityRange, 'Price Range');
                                setImpliedVolatilityRange(volatilityRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {volatilityRange[0]} to {volatilityRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                        {/*<Slider onChangeEnd={(val) => {*/}
                        {/*  setImpliedVolatility((val));*/}
                        {/*  console.log(val);*/}
                        {/*}} min={10} max={100}>*/}
                        {/*  <SliderTrack bg='red.100'>*/}
                        {/*    <Box position='relative' right={10} />*/}
                        {/*    <SliderFilledTrack bg='blue' />*/}
                        {/*  </SliderTrack>*/}
                        {/*  <SliderThumb boxSize={6} />*/}
                        {/*</Slider>*/}

                      </AccordionPanel>
                    </AccordionItem>

                    {/*<AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>*/}
                    {/*  <h2>*/}
                    {/*    <AccordionButton>*/}
                    {/*      <Box flex='1' textAlign='left'>*/}
                    {/*        Sector*/}
                    {/*      </Box>*/}
                    {/*      <AccordionIcon color={'#515769'} fontSize={32} />*/}
                    {/*    </AccordionButton>*/}
                    {/*  </h2>*/}
                    {/*  <AccordionPanel pb={4}>*/}
                    {/*    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod*/}
                    {/*    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim*/}
                    {/*  </AccordionPanel>*/}
                    {/*</AccordionItem>*/}

                    {/*<AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>*/}
                    {/* <h2>*/}
                    {/*    <AccordionButton>*/}
                    {/*      <Box flex="1" textAlign="left">*/}
                    {/*        Unusual Activity*/}
                    {/*      </Box>*/}
                    {/*      <AccordionIcon color={'#515769'} fontSize={32} />*/}
                    {/*    </AccordionButton>*/}
                    {/*  </h2>*/}
                    {/*  <AccordionPanel pb={4}>*/}
                    {/*    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod*/}
                    {/*    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim*/}
                    {/*  </AccordionPanel>*/}
                    {/*</AccordionItem>*/}

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton display={'flex'} justifyContent={'space-between'}>
                          <Box flex='1' textAlign='left'>
                            Weekly Options
                          </Box>
                          <Switch isChecked={weeklyOptions} onChange={() => {
                            setWeeklyOptions(!weeklyOptions);
                          }} />
                        </AccordionButton>
                      </h2>

                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            MarketCapRange
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <HStack py={8}>

                          <NumberInput onChange={onMinMarketCapRangeChange} min={100000} max={1000000}
                                       value={marketCapRange[0]}
                          >
                            <NumberInputField placeholder={marketCapRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxMarketCapRangeChange}
                                       min={marketCapRange[0]} max={1000000}
                                       value={marketCapRange[1]}>
                            <NumberInputField placeholder={marketCapRange[1]}
                            />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched MarketCap Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedCapRange.map((capRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(capRange, 'Market cap Range');
                                setMarketCapRange(capRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {capRange[0]} to {capRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                        {/*<Slider onChangeEnd={(val) => {*/}
                        {/*  setMarketCapRange((val));*/}
                        {/*  console.log(val);*/}
                        {/*}} min={100000} max={1000000}>*/}
                        {/*  <SliderTrack bg='red.100'>*/}
                        {/*    <Box position='relative' right={10} />*/}
                        {/*    <SliderFilledTrack bg='blue' />*/}
                        {/*  </SliderTrack>*/}
                        {/*  <SliderThumb boxSize={6} />*/}
                        {/*</Slider>*/}

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Open Interest
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>

                        <HStack py={8}>

                          <NumberInput onChange={onMinOpenInterestRangeChange} min={100} max={10000}
                                       value={openInterestRange[0]}
                          >
                            <NumberInputField placeholder={openInterestRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxOpenInterestRangeChange}
                                       min={openInterestRange[0]} max={1000000}
                                       value={openInterestRange[1]}>
                            <NumberInputField placeholder={openInterestRange[1]}
                            />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Open Interest Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedOpenInterestRange.map((openInterestRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(openInterestRange, 'open interest Range');
                                setOpenInterestRange(openInterestRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {openInterestRange[0]} to {openInterestRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                        {/*<Slider onChangeEnd={(val) => {*/}
                        {/*  setOpenInterest((val));*/}
                        {/*  console.log(val);*/}
                        {/*}} min={10} max={10000}>*/}
                        {/*  <SliderTrack bg='red.100'>*/}
                        {/*    <Box position='relative' right={10} />*/}
                        {/*    <SliderFilledTrack bg='blue' />*/}
                        {/*  </SliderTrack>*/}
                        {/*  <SliderThumb boxSize={6} />*/}
                        {/*</Slider>*/}

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Expiration Date
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Input style={{color: 'white'}} type={'date'} my={'1rem'} placeholer={'Expiration Date'} />
                      </AccordionPanel>
                    </AccordionItem>

                  </Accordion>

                </ModalBody>
              ) : (
                // 2ND PAGE ACCORDION / MODEL BODY
                <ModalBody color={'#fff'} pb={8} px={0} pt={0}>
                  <Accordion allowToggle>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Call Volume
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinCallVolumeRangeChange} min={30} max={60}
                                       value={callVolumeRange[0]}>
                            <NumberInputField placeholder={callVolumeRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxCallVolumeRangeChange} min={callVolumeRange[0]} max={60}
                                       value={callVolumeRange[1]}>
                            <NumberInputField placeholder={callVolumeRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Call Volume Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedCAllVolumeRanges.map((callVolumeRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(callVolumeRange, 'CAll volume Range');
                                setCallVolumeRange(callVolumeRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {callVolumeRange[0]} to {callVolumeRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>
                        {/*<RadioGroup onChange={setDaysOfExpiration} value={daysOfExpiration}>*/}
                        {/*  <Stack direction='row'>*/}
                        {/*    <Radio value='1'>1</Radio>*/}
                        {/*    <Radio value='3'>3</Radio>*/}
                        {/*    <Radio value='7'>7</Radio>*/}
                        {/*    <Radio value='15'>15</Radio>*/}
                        {/*    <Radio value='30'>30</Radio>*/}
                        {/*  </Stack>*/}
                        {/*</RadioGroup>*/}
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Put Volume
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinPutVolumeRangeChange} min={30} max={60}
                                       value={putVolumeRange[0]}>
                            <NumberInputField placeholder={putVolumeRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxPutVolumeRangeChange} min={putVolumeRange[0]} max={60}
                                       value={putVolumeRange[1]}>
                            <NumberInputField placeholder={putVolumeRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Put Volume Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPutVolumeRanges.map((putVolumeRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(putVolumeRange, 'CAll volume Range');
                                setPutVolumeRange(putVolumeRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {putVolumeRange[0]} to {putVolumeRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Premium Call
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinPremiumCallRangeChange} min={30} max={60}
                                       value={premiumCallRange[0]}>
                            <NumberInputField placeholder={premiumCallRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxPremiumCallRangeChange} min={premiumCallRange[0]} max={60}
                                       value={premiumCallRange[1]}>
                            <NumberInputField placeholder={premiumCallRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Premium Call Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPremiumCallRanges.map((premiumCallRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(premiumCallRange, 'Premium call Range');
                                setPremiumCallRange(premiumCallRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {premiumCallRange[0]} to {premiumCallRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Premium Put
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinPremiumPutRangeChange} min={30} max={60}
                                       value={premiumPutRange[0]}>
                            <NumberInputField placeholder={premiumPutRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxPremiumPutRangeChange} min={premiumPutRange[0]} max={60}
                                       value={premiumPutRange[1]}>
                            <NumberInputField placeholder={premiumPutRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Premium Put Ranges
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPremiumPutRanges.map((premiumPutRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(premiumPutRange, 'Premium Put Range');
                                setPremiumPutRange(premiumPutRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {premiumPutRange[0]} to {premiumPutRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Premium Call Volume Count
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinPremiumCallVolumeRangeChange} min={100} max={1000}
                                       value={premiumCallVolume[0]}>
                            <NumberInputField placeholder={premiumCallVolume[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxPremiumCallVolumeRangeChange} min={premiumCallVolume[0]} max={1000}
                                       value={premiumCallVolume[1]}>
                            <NumberInputField placeholder={premiumCallVolume[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Premium Call Volume Count
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPremiumCallVolumeRanges.map((premiumCallVolume, index) => (
                              <Box key={index} onClick={() => {
                                console.log(premiumCallVolume, 'premiumCallVolume Range');
                                setPremiumCallVolume(premiumCallVolume);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {premiumCallVolume[0]} to {premiumCallVolume[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                            Premium Put Volume Count
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinPremiumPutVolumeRangeChange} min={100} max={1000}
                                       value={premiumPutVolume[0]}>
                            <NumberInputField placeholder={premiumPutVolume[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxPremiumPutVolumeRangeChange} min={premiumPutVolume[0]} max={1000}
                                       value={premiumPutVolume[1]}>
                            <NumberInputField placeholder={premiumPutVolume[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Premium Put Volume Count
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedPremiumPutVolumeRanges.map((premiumPutVolume, index) => (
                              <Box key={index} onClick={() => {
                                console.log(premiumPutVolume, 'premiumPutVolume Range');
                                setPremiumPutVolume(premiumPutVolume);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {premiumPutVolume[0]} to {premiumPutVolume[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderTop={0} borderBottom={'1px solid #21232F'}>
                      <h2>
                        <AccordionButton>
                          <Box flex='1' textAlign='left'>
                           Total Count
                          </Box>
                          <AccordionIcon color={'#515769'} fontSize={32} />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>


                        <HStack py={8}>

                          <NumberInput onChange={onMinTotalCountRangeChange} min={100} max={1000}
                                       value={totalCountRange[0]}>
                            <NumberInputField placeholder={totalCountRange[0]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                          <Box>
                            to
                          </Box>

                          <NumberInput onChange={onMaxTotalCountRangeChange} min={totalCountRange[0]} max={1000}
                                       value={totalCountRange[1]}>
                            <NumberInputField placeholder={totalCountRange[1]} />
                            {/*<NumberInputStepper>*/}
                            {/*  <NumberIncrementStepper />*/}
                            {/*  <NumberDecrementStepper />*/}
                            {/*</NumberInputStepper>*/}
                          </NumberInput>

                        </HStack>

                        <Text mb={'1rem'} as={'h2'} fontSize={'12px'} color={'gray.300'}>
                          Mostly Searched Total Count Range
                        </Text>

                        <Flex mb={'1rem'} spacing={4} flexWrap={'wrap'} justifyContent={'center'}>

                          {
                            mostlySearchedtotalCountRanges.map((totalCountRange, index) => (
                              <Box key={index} onClick={() => {
                                console.log(totalCountRange, 'totalCountRange Range');
                                setTotalCountRange(totalCountRange);
                              }
                              } m={1} cursor={'pointer'} as={'button'} borderRadius={'lg'} px={3} py={2} bg={'#323546'}>
                                {totalCountRange[0]} to {totalCountRange[1]}
                              </Box>
                            ))
                          }

                        </Flex>

                      </AccordionPanel>
                    </AccordionItem>

                  </Accordion>
                </ModalBody>
              )
            }


          </ModalContent>

        </Modal>

        {searchValue.length > 0 && (
          <div className={`close-button`} onClick={handleClose}>
            <Icon.X />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className='results'>
          {results.map((result, index) => (
            <Link key={index} to={`state/${result.route}`}>
              <div className='result'>
                <div className='result-left'>
                  <div className='result-name'>
                    {`${result.name}`}
                    {result.type === 'district' &&
                    `, ${STATE_NAMES[result.route]}`}
                  </div>
                </div>
                <div className='result-type'>
                  <span>{[result.route]}</span>
                  <Icon.ArrowRightCircle size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {expand && (
        <>
          <div className='expanded'>
            <div className='expanded-left'>
              <h3>{'Trending Symbol'}</h3>
              <div className='suggestions'>
                {trendingSymbolSuggestions.map((suggestion, index) => (
                  <div className='suggestion' key={index}>
                    <div>-</div>
                    <h4
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setNativeValue(searchInput.current, suggestion);
                        searchInput.current.dispatchEvent(
                          new Event('input', {bubbles: true}),
                        );
                      }}
                    >
                      {suggestion}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            <div className='expanded-right'>
              <h3>{'Trending Sector'}</h3>
              <div className='suggestions'>
                {trendingSectorSuggestions.map((suggestion, index) => (
                  <div className='suggestion' key={index}>
                    <div>-</div>
                    <h4
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setNativeValue(searchInput.current, suggestion);
                        searchInput.current.dispatchEvent(
                          new Event('input', {bubbles: true}),
                        );
                      }}
                    >
                      {t(suggestion)}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const isEqual = () => {
  return true;
};

export default memo(Search, isEqual);
