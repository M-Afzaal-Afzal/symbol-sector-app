import {
  DATA_API_ROOT, DISTRICT_START_DATE, DISTRICT_TEST_END_DATE,
  MAP_STATISTICS,
  PRIMARY_STATISTICS,
  STATE_NAMES,
  STATISTIC_CONFIGS, TESTED_EXPIRING_DAYS,
  UNKNOWN_DISTRICT_KEY,
} from '../constants';
import useIsVisible from '../hooks/useIsVisible';
import {
  fetcher,
  formatNumber,
  getStatistic,
  parseIndiaDate,
  retry,
} from '../utils/commonFunctions';

import {SmileyIcon} from '@primer/octicons-react';
import classnames from 'classnames';
import {addDays, formatISO, max} from 'date-fns';
import {
  memo,
  useMemo,
  useState,
  useEffect,
  lazy,
  Suspense,
  useRef,
} from 'react';
import {Helmet} from 'react-helmet';
import {useTranslation} from 'react-i18next';
import {useLocation, useParams} from 'react-router-dom';
import {useLocalStorage, useSessionStorage, useWindowSize} from 'react-use';
import useSWR from 'swr';
import TableLoader from './loaders/Table';
import Search from './Search';
import Actions from './Actions';
import {Avatar, Box, Heading, HStack, Text} from '@chakra-ui/react';
import {FaRegGrinAlt, FaRegFrown, FaChevronDown} from 'react-icons/fa';
import ProfileEntity from './ProfileEntity';
import FeelingCard from './FeelingCard/FeelingCard';

const Table = lazy(() => retry(() => import('../components/Table')));

const DeltaBarGraph = lazy(() => retry(() => import('./DeltaBarGraph')));
const Footer = lazy(() => retry(() => import('./Footer')));
const Level = lazy(() => retry(() => import('./Level')));
const VaccinationHeader = lazy(() =>
  retry(() => import('./VaccinationHeader')),
);
const MapExplorer = lazy(() => retry(() => import('./MapExplorer')));
const MapSwitcher = lazy(() => retry(() => import('./MapSwitcher')));
const Minigraphs = lazy(() => retry(() => import('./Minigraphs')));
const StateHeader = lazy(() => retry(() => import('./StateHeader')));
const StateMeta = lazy(() => retry(() => import('./StateMeta')));
const TimeseriesExplorer = lazy(() =>
  retry(() => import('./TimeseriesExplorer')),
);

function State() {
  const {t} = useTranslation();


  const stateCode = useParams().stateCode.toUpperCase();

  const [mapStatistic, setMapStatistic] = useSessionStorage(
    'mapStatistic',
    'active',
  );
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [regionHighlighted, setRegionHighlighted] = useState({
    stateCode: stateCode,
    districtName: null,
  });
  const [delta7Mode, setDelta7Mode] = useState(false);

  useEffect(() => {
    if (regionHighlighted.stateCode !== stateCode) {
      setRegionHighlighted({
        stateCode: stateCode,
        districtName: null,
      });
      setShowAllDistricts(false);
    }
  }, [regionHighlighted.stateCode, stateCode]);

  const {data: timeseries, error: timeseriesResponseError} = useSWR(
    `${DATA_API_ROOT}/timeseries-${stateCode}.min.json`,
    fetcher,
    {
      revalidateOnMount: true,
      refreshInterval: 100000,
    },
  );

  const {data} = useSWR(`${DATA_API_ROOT}/data.min.json`, fetcher, {
    revalidateOnMount: true,
    refreshInterval: 100000,
  });

  const stateData = data?.[stateCode];

  const toggleShowAllDistricts = () => {
    setShowAllDistricts(!showAllDistricts);
  };

  const handleSort = (districtNameA, districtNameB) => {
    const districtA = stateData.districts[districtNameA];
    const districtB = stateData.districts[districtNameB];
    return (
      getStatistic(districtB, 'total', mapStatistic) -
      getStatistic(districtA, 'total', mapStatistic)
    );
  };

  const gridRowCount = useMemo(() => {
    if (!stateData) return;
    const gridColumnCount = window.innerWidth >= 540 ? 3 : 2;
    const districtCount = stateData?.districts
      ? Object.keys(stateData.districts).filter(
        (districtName) => districtName !== 'Unknown',
      ).length
      : 0;
    const gridRowCount = Math.ceil(districtCount / gridColumnCount);
    return gridRowCount;
  }, [stateData]);

  const stateMetaElement = useRef();
  const isStateMetaVisible = useIsVisible(stateMetaElement);

  const trail = useMemo(() => {
    const styles = [];

    [0, 0, 0, 0].map((element, index) => {
      styles.push({
        animationDelay: `${index * 250}ms`,
      });
      return null;
    });
    return styles;
  }, []);

  const lookback = showAllDistricts ? (window.innerWidth >= 540 ? 10 : 8) : 6;

  const lastDataDate = useMemo(() => {
    const updatedDates = [
      stateData?.meta?.date,
      stateData?.meta?.tested?.date,
      stateData?.meta?.vaccinated?.date,
    ].filter((date) => date);
    return updatedDates.length > 0
      ? formatISO(max(updatedDates.map((date) => parseIndiaDate(date))), {
        representation: 'date',
      })
      : null;
  }, [stateData]);

  const primaryStatistic = MAP_STATISTICS.includes(mapStatistic)
    ? mapStatistic
    : 'confirmed';

  const noDistrictData = useMemo(() => {
    // Heuristic: All cases are in Unknown
    return !!(
      stateData?.districts &&
      stateData.districts?.[UNKNOWN_DISTRICT_KEY] &&
      PRIMARY_STATISTICS.every(
        (statistic) =>
          getStatistic(stateData, 'total', statistic) ===
          getStatistic(
            stateData.districts[UNKNOWN_DISTRICT_KEY],
            'total',
            statistic,
          ),
      )
    );
  }, [stateData]);

  const statisticConfig = STATISTIC_CONFIGS[primaryStatistic];

  const noRegionHighlightedDistrictData =
    regionHighlighted?.districtName &&
    regionHighlighted.districtName !== UNKNOWN_DISTRICT_KEY &&
    noDistrictData;

  const districts = Object.keys(
    ((!noDistrictData || !statisticConfig.hasPrimary) &&
      stateData?.districts) ||
    {},
  );

  // table configuration is there
  const [date, setDate] = useState('');
  const [expandTable, setExpandTable] = useLocalStorage('expandTable', false);
  const hideDistrictData = date !== '' && date < DISTRICT_START_DATE;

  const hideDistrictTestData =
    date === '' ||
    date >
    formatISO(
      addDays(parseIndiaDate(DISTRICT_TEST_END_DATE), TESTED_EXPIRING_DAYS),
      {representation: 'date'},
    );

  const hideVaccinated =
    getStatistic(data?.['TT'], 'total', 'vaccinated') === 0;

  const noDistrictDataStates = useMemo(
    () =>
      // Heuristic: All cases are in Unknown
      Object.entries(data || {}).reduce((res, [stateCode, stateData]) => {
        res[stateCode] = !!(
          stateData?.districts &&
          stateData.districts?.[UNKNOWN_DISTRICT_KEY] &&
          PRIMARY_STATISTICS.every(
            (statistic) =>
              getStatistic(stateData, 'total', statistic) ===
              getStatistic(
                stateData.districts[UNKNOWN_DISTRICT_KEY],
                'total',
                statistic,
              ),
          )
        );
        return res;
      }, {}),
    [data],
  );

  console.log(timeseries, 'Time series');

  const {width} = useWindowSize();
  const [anchor, setAnchor] = useLocalStorage('anchor', null);
  const homeRightElement = useRef();
  const isVisible = useIsVisible(homeRightElement);
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>
          Coronavirus Outbreak in {STATE_NAMES[stateCode]} - covid19india.org
        </title>
        <meta
          name='title'
          content={`Coronavirus Outbreak in ${STATE_NAMES[stateCode]}: Latest Map and Case Count`}
        />
      </Helmet>

      <div className='State'>
        <div className='state-left'>

          {/* HEADER IS THERE */}
          <div className='header'>
            <Suspense fallback={<div />}>
              <Search />
            </Suspense>

            {!data && !timeseries && <div style={{height: '60rem'}} />}

            <>
              {!timeseries && <div style={{minHeight: '61px'}} />}
              {timeseries && (
                <Suspense fallback={<div style={{minHeight: '61px'}} />}>
                  <Actions
                    {...{
                      date,
                      setDate,
                      dates: Object.keys(timeseries[stateCode]?.dates),
                    }}
                  />
                </Suspense>
              )}
            </>

          </div>

          <StateHeader data={stateData} stateCode={stateCode} />

          <div style={{position: 'relative',marginTop: '2rem'}}>
            <MapSwitcher {...{mapStatistic, setMapStatistic}} />
            <Level data={stateData} />
            <Minigraphs
              timeseries={timeseries?.[stateCode]?.dates}
              {...{stateCode}}
              forceRender={!!timeseriesResponseError}
            />
          </div>

          {stateData?.total?.vaccinated1 && (
            <VaccinationHeader data={stateData} />
          )}

          {data && (
            <Suspense fallback={<TableLoader />}>
              <Table
                {...{
                  data,
                  regionHighlighted,
                  setRegionHighlighted,
                  expandTable,
                  setExpandTable,
                  hideDistrictData,
                  hideDistrictTestData,
                  hideVaccinated,
                  lastDataDate,
                  noDistrictDataStates,
                }}
              />
            </Suspense>
          )}

          {/*{data && (*/}
          {/*  <Suspense fallback={<div style={{minHeight: '50rem'}} />}>*/}
          {/*    <MapExplorer*/}
          {/*      {...{*/}
          {/*        stateCode,*/}
          {/*        data,*/}
          {/*        regionHighlighted,*/}
          {/*        setRegionHighlighted,*/}
          {/*        mapStatistic,*/}
          {/*        setMapStatistic,*/}
          {/*        lastDataDate,*/}
          {/*        delta7Mode,*/}
          {/*        setDelta7Mode,*/}
          {/*        noRegionHighlightedDistrictData,*/}
          {/*        noDistrictData,*/}
          {/*      }}*/}
          {/*    ></MapExplorer>*/}
          {/*  </Suspense>*/}
          {/*)}*/}

          {/*<span ref={stateMetaElement} />*/}

          {/*{isStateMetaVisible && data && (*/}
          {/*  <Suspense fallback={<div />}>*/}
          {/*    <StateMeta*/}
          {/*      {...{*/}
          {/*        stateCode,*/}
          {/*        data,*/}
          {/*      }}*/}
          {/*      timeseries={timeseries?.[stateCode]?.dates}*/}
          {/*    />*/}
          {/*  </Suspense>*/}
          {/*)}*/}
        </div>

        <div className='state-right' ref={homeRightElement}>
          <FeelingCard />

          <div />

          {(isVisible || location.hash) && (
            <>
              {data && (
                <div
                  style={{
                    marginTop: '-5rem',
                  }}
                  className={classnames('map-container', {
                    expanded: expandTable,
                    stickied:
                      anchor === 'mapexplorer' || (expandTable && width >= 769),
                  })}
                >

                </div>
              )}

              {timeseries && (
                <Suspense fallback={<div style={{height: '50rem'}} />}>
                  <TimeseriesExplorer
                    stateCode='TT'
                    {...{
                      timeseries,
                      date,
                      regionHighlighted,
                      setRegionHighlighted,
                      anchor,
                      setAnchor,
                      expandTable,
                      hideVaccinated,
                      noRegionHighlightedDistrictData,
                    }}
                  />
                </Suspense>
              )}
            </>
          )}

          {/*<>*/}
          {/*  <div className="district-bar">*/}
          {/*    <div*/}
          {/*      className={classnames('district-bar-top', {*/}
          {/*        expanded: showAllDistricts,*/}
          {/*      })}*/}
          {/*    >*/}
          {/*      <div className="district-bar-left">*/}
          {/*        <h2*/}
          {/*          className={classnames(primaryStatistic, 'fadeInUp')}*/}
          {/*          style={trail[0]}*/}
          {/*        >*/}
          {/*          {t('Top districts')}*/}
          {/*        </h2>*/}
          {/*        <div*/}
          {/*          className={`districts fadeInUp ${*/}
          {/*            showAllDistricts ? 'is-grid' : ''*/}
          {/*          }`}*/}
          {/*          style={*/}
          {/*            showAllDistricts*/}
          {/*              ? {*/}
          {/*                  gridTemplateRows: `repeat(${gridRowCount}, 2rem)`,*/}
          {/*                  ...trail[1],*/}
          {/*                }*/}
          {/*              : trail[1]*/}
          {/*          }*/}
          {/*        >*/}
          {/*          {districts*/}
          {/*            .filter((districtName) => districtName !== 'Unknown')*/}
          {/*            .sort((a, b) => handleSort(a, b))*/}
          {/*            .slice(0, showAllDistricts ? undefined : 5)*/}
          {/*            .map((districtName) => {*/}
          {/*              const total = getStatistic(*/}
          {/*                stateData.districts[districtName],*/}
          {/*                'total',*/}
          {/*                primaryStatistic*/}
          {/*              );*/}
          {/*              const delta = getStatistic(*/}
          {/*                stateData.districts[districtName],*/}
          {/*                'delta',*/}
          {/*                primaryStatistic*/}
          {/*              );*/}
          {/*              return (*/}
          {/*                <div key={districtName} className="district">*/}
          {/*                  <h2>{formatNumber(total)}</h2>*/}
          {/*                  <h5>{t(districtName)}</h5>*/}
          {/*                  {primaryStatistic !== 'active' && (*/}
          {/*                    <div className="delta">*/}
          {/*                      <h6 className={primaryStatistic}>*/}
          {/*                        {delta > 0*/}
          {/*                          ? '\u2191' + formatNumber(delta)*/}
          {/*                          : ''}*/}
          {/*                      </h6>*/}
          {/*                    </div>*/}
          {/*                  )}*/}
          {/*                </div>*/}
          {/*              );*/}
          {/*            })}*/}
          {/*        </div>*/}
          {/*      </div>*/}

          {/*      <div className="district-bar-right fadeInUp" style={trail[2]}>*/}
          {/*        {timeseries &&*/}
          {/*          (primaryStatistic === 'confirmed' ||*/}
          {/*            primaryStatistic === 'deceased') && (*/}
          {/*            <div className="happy-sign">*/}
          {/*              {Object.keys(timeseries[stateCode]?.dates || {})*/}
          {/*                .slice(-lookback)*/}
          {/*                .every(*/}
          {/*                  (date) =>*/}
          {/*                    getStatistic(*/}
          {/*                      timeseries[stateCode].dates[date],*/}
          {/*                      'delta',*/}
          {/*                      primaryStatistic*/}
          {/*                    ) === 0*/}
          {/*                ) && (*/}
          {/*                <div*/}
          {/*                  className={`alert ${*/}
          {/*                    primaryStatistic === 'confirmed' ? 'is-green' : ''*/}
          {/*                  }`}*/}
          {/*                >*/}
          {/*                  <SmileyIcon />*/}
          {/*                  <div className="alert-right">*/}
          {/*                    No new {primaryStatistic} cases in the past five*/}
          {/*                    days*/}
          {/*                  </div>*/}
          {/*                </div>*/}
          {/*              )}*/}
          {/*            </div>*/}
          {/*          )}*/}
          {/*        <DeltaBarGraph*/}
          {/*          timeseries={timeseries?.[stateCode]?.dates}*/}
          {/*          statistic={primaryStatistic}*/}
          {/*          {...{stateCode, lookback}}*/}
          {/*          forceRender={!!timeseriesResponseError}*/}
          {/*        />*/}
          {/*      </div>*/}
          {/*    </div>*/}

          {/*    <div className="district-bar-bottom">*/}
          {/*      {districts.length > 5 ? (*/}
          {/*        <button*/}
          {/*          className="button fadeInUp"*/}
          {/*          onClick={toggleShowAllDistricts}*/}
          {/*          style={trail[3]}*/}
          {/*        >*/}
          {/*          <span>*/}
          {/*            {t(showAllDistricts ? 'View less' : 'View all')}*/}
          {/*          </span>*/}
          {/*        </button>*/}
          {/*      ) : (*/}
          {/*        <div style={{height: '3.75rem', flexBasis: '15%'}} />*/}
          {/*      )}*/}
          {/*    </div>*/}
          {/*  </div>*/}

          {/*  <Suspense fallback={<div />}>*/}
          {/*    <TimeseriesExplorer*/}
          {/*      {...{*/}
          {/*        stateCode,*/}
          {/*        timeseries,*/}
          {/*        regionHighlighted,*/}
          {/*        setRegionHighlighted,*/}
          {/*        noRegionHighlightedDistrictData,*/}
          {/*      }}*/}
          {/*      forceRender={!!timeseriesResponseError}*/}
          {/*    />*/}
          {/*  </Suspense>*/}
          {/*</>*/}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default memo(State);
