import './App.scss';
import Blog from './components/Blog';
import Navbar from './components/Navbar';
import {retry} from './utils/commonFunctions';
import {ChakraProvider} from '@chakra-ui/react';

import {lazy, useState, Suspense, useEffect} from 'react';
import {Route, Redirect, Switch, useLocation} from 'react-router-dom';
import {Auth0Provider} from '@auth0/auth0-react';
import 'firebase/firestore';
import {FirebaseAppProvider, useFirestoreDocData, useFirestore} from 'reactfire';

const Home = lazy(() => retry(() => import('./components/Home')));
const About = lazy(() => retry(() => import('./components/About')));
const Alert = lazy(() => retry(() => import('./components/Alert')));
const State = lazy(() => retry(() => import('./components/State')));
const Resources = lazy(() => retry(() => import('./components/Resources')));
const LanguageSwitcher = lazy(() =>
  retry(() => import('./components/LanguageSwitcher')),
);

const firebaseConfig = {
  /* Add your config from the Firebase Console */
  apiKey: 'AIzaSyBT0Wg6pr96BZ6S35GqU30ues8Q5BzipQ8',
  authDomain: 'krishna-symbol-status.firebaseapp.com',
  projectId: 'krishna-symbol-status',
  storageBucket: 'krishna-symbol-status.appspot.com',
  messagingSenderId: '288694351907',
  appId: '1:288694351907:web:c4ddc45ac1fe3cc67e1996',
};

const App = () => {
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false);
  const location = useLocation();


  /*

  <!-- The core Firebase JS SDK is always required and must be listed first -->
<script src="https://www.gstatic.com/firebasejs/8.9.1/firebase-app.js"></script>

<!-- TODO: Add SDKs for Firebase products that you want to use
     https://firebase.google.com/docs/web/setup#available-libraries -->

<script>
  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyBT0Wg6pr96BZ6S35GqU30ues8Q5BzipQ8",
    authDomain: "krishna-symbol-status.firebaseapp.com",
    projectId: "krishna-symbol-status",
    storageBucket: "krishna-symbol-status.appspot.com",
    messagingSenderId: "288694351907",
    appId: "1:288694351907:web:c4ddc45ac1fe3cc67e1996"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
</script>
   */

  const pages = [
    {
      pageLink: '/',
      view: Home,
      displayName: 'Home',
      showInNavbar: true,
    },
    {
      pageLink: '/',
      view: Blog,
      displayName: 'Login',
      showInNavbar: true,
    },
    {
      pageLink: '/alert',
      view: Alert,
      displayName: 'Create Alert',
      showInNavbar: true,
    },
    {
      pageLink: '/resources',
      view: Resources,
      displayName: 'Resources',
      showInNavbar: true,
    },
    {
      pageLink: '/state/:stateCode',
      view: State,
      displayName: 'State',
      showInNavbar: false,
    },
  ];

  useEffect(() => {
    if (showLanguageSwitcher) {
      // For Chrome, Firefox, IE and Opera
      document.documentElement.scrollTo({top: 0, behavior: 'smooth'});
      // For Safari
      document.body.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [showLanguageSwitcher]);

  return (
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <Auth0Provider
        domain='dev-jfm17sx4.us.auth0.com'
        clientId='hsnoVxcFuLh9lqpQCtXtu7lQXv7X70ij'
        redirectUri={window.location.origin}
      >
        <ChakraProvider>
          <div className='App'>

            <Suspense fallback={<div />}>
              <LanguageSwitcher
                {...{showLanguageSwitcher, setShowLanguageSwitcher}}
              />
            </Suspense>

            <Navbar {...{pages, showLanguageSwitcher, setShowLanguageSwitcher}} />

            <Suspense fallback={<div />}>
              <Switch location={location}>
                {pages.map((page, index) => {
                  return (
                    <Route
                      exact
                      path={page.pageLink}
                      render={({match}) => <page.view />}
                      key={index}
                    />
                  );
                })}
                <Redirect to='/' />
              </Switch>
            </Suspense>
          </div>
        </ChakraProvider>
      </Auth0Provider>
    </FirebaseAppProvider>

  );
};

export default App;
