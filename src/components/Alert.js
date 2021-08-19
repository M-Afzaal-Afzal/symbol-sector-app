import React, {useState} from 'react';
import {Box, Button} from '@chakra-ui/react';
import {useMediaQuery} from '@chakra-ui/react';
import {useAuth0} from '@auth0/auth0-react';
import useDarkMode from 'use-dark-mode';
import {makeStyles} from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import {Paper, Typography} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  actionsContainer: {
    marginBottom: theme.spacing(2),
  },
  resetContainer: {
    padding: theme.spacing(3),
  },
  step: {
    "&$completed": {
      color: "#12C7FF"
    },
    "&$active": {
      color: "#12C7FF"
    },
    "&$disabled": {
      // color: "#12C7FF"
    },
  },
  alternativeLabel: {
    color: 'white',
  },
  active: {}, //needed so that the &$active tag works
  completed: {},
  disabled: {},
  labelContainer: {
    "&$alternativeLabel": {
      marginTop: 0,
      color: 'white',
    },
  },
}));

const Alert = () => {

  const [isLargerThan770] = useMediaQuery('(min-width: 770px)');

  const {user, isAuthenticated, isLoading} = useAuth0();

  const {value} = useDarkMode();

  // LOGIN WIHT OAUTH
  const {loginWithRedirect} = useAuth0();

  const classes = useStyles();

  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Select Coin(s)', 'Select Alerting Method(s)', 'Select Default Alert', 'Configure Alert'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (

    isAuthenticated ? (
        <Box
          display={'grid'}
          gridTemplateColumns={isLargerThan770 ? '5rem 1fr' : '1fr'} maxW={'container.xl'}
        >
          <Box />

          <Box px={'3rem'} py={'3rem'}>

            <Stepper
              style={{background: value ? '#161625' : 'white',color: value ? 'white' : ''}}
              activeStep={activeStep} orientation='vertical'
            >

              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      classes: {
                        root: classes.step,
                        completed: classes.completed,
                        active: classes.active,
                        disabled: classes.disabled
                      }
                    }}
                    style={{background: value ? '#161625' : 'white',color: value ? 'white !important' : ''}} onClick={() => {setActiveStep(index)}}>{label}</StepLabel>
                  <StepContent>
                    <Typography>{'getStepContent(index)'}</Typography>
                    <div className={classes.actionsContainer}>
                      <div>
                        <Button
                          disabled={activeStep === 0}
                          onClick={handleBack}
                          className={classes.button}
                          colorScheme={'blue'}
                        >
                          Back
                        </Button>
                        <Button
                          // variant='contained'
                          // color='primary'
                          colorScheme={'blue'}
                          onClick={handleNext}
                          className={classes.button}
                        >
                          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                      </div>
                    </div>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {activeStep === steps.length && (
              <Paper square elevation={0} className={classes.resetContainer}>
                <Typography>All steps completed - you&apos;re finished</Typography>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleReset}
                  className={classes.button}
                  colorScheme={'blue'}
                >
                  Reset
                </Button>
                <Button
                  // variant='contained'
                  // color='primary'
                  colorScheme={'blue'}

                  className={classes.button}
                >
                 Create Alert
                </Button>
              </Paper>
            )}

          </Box>

        </Box>
      ) :
      (
        <Box display={'grid'} gridTemplateColumns={isLargerThan770 ? '5rem 1fr' : '1fr'} maxW={'container.xl'}>

          <Box zIndex={-5} />

          <Box px={'1.5rem'} py={'3rem'}>

            <Box fontSize={'1.5rem !important'} textAlign={'center'}
                 color={value ? 'white !important' : 'gray.500 !important'}>

              You must have to login to create an alert
            </Box>

            <Box mt={'1.5rem'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
              <Button onClick={() => {
                loginWithRedirect()
                  .then((res) => {
                    console.log(res);
                  });
              }} colorScheme={'blue'}>
                Login
              </Button>
            </Box>


          </Box>


        </Box>

      )

  );

};

export default Alert;