import * as Sentry from '@sentry/browser';
import { Suspense, lazy } from 'react';
import { Switch, Route, Router, BaseLocationHook } from 'wouter';
import { BrowserTracing } from '@sentry/tracing';

import { Loading } from './components/Layouts/Loading';
import { NotFound } from './components/Common/NotFound';
import { SRTablesListPage } from './pages/SRTablesListPage';
import { CRTablesListPage } from './pages/CRTablesListPage';
import { RRTablesListPage } from './pages/RRTablesListPage';
import { useHashLocation } from './hooks/useHashLcocation';
import {
  ASSERTIONS_ROUTE_PATH,
  BM_ROUTE_PATH,
  COLUMN_DETAILS_ROUTE_PATH,
  RECONCILE_COLUMNS_DETAILS_ROUTE_PATH,
} from './utils/routes';
import { SRAssertionListPage } from './pages/SRAssertionListPage';
import { CRAssertionListPage } from './pages/CRAssertionListPage';
import { SRBMPage } from './pages/SRBMPage';
import { CRBMPage } from './pages/CRBMPage';

const sentryDns = window.PIPERIDER_METADATA.sentry_dns;
if (sentryDns && process.env.NODE_ENV !== 'development') {
  const sentryEnv = window.PIPERIDER_METADATA.sentry_env || 'development';
  const appVersion = window.PIPERIDER_METADATA.version;
  const releaseVersion = sentryEnv === 'development' ? undefined : appVersion;
  Sentry.init({
    dsn: sentryDns,
    environment: sentryEnv,
    release: releaseVersion,
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  Sentry.setTag('piperider.version', appVersion);
}

const SRColumnDetailsPage = lazy(() => import('./pages/SRColumnDetailsPage'));
const CRColumnDetailsPage = lazy(() => import('./pages/CRColumnDetailsPage'));
const RRColumnDetailsPage = lazy(() => import('./pages/RRColumnDetailsPage'));

function AppSingle() {
  return (
    <Suspense fallback={<Loading />}>
      <Router hook={useHashLocation as BaseLocationHook}>
        <Switch>
          <Route
            path="/"
            component={() => (
              <SRTablesListPage data={window.PIPERIDER_SINGLE_REPORT_DATA} />
            )}
          />

          <Route path={COLUMN_DETAILS_ROUTE_PATH}>
            {({ tableName, columnName }) => (
              <SRColumnDetailsPage
                tableName={decodeURIComponent(tableName || '')}
                columnName={decodeURIComponent(columnName || '')}
                data={window.PIPERIDER_SINGLE_REPORT_DATA || {}}
              />
            )}
          </Route>

          <Route path={ASSERTIONS_ROUTE_PATH}>
            {() => (
              <SRAssertionListPage
                data={window.PIPERIDER_SINGLE_REPORT_DATA || {}}
              />
            )}
          </Route>

          <Route path={BM_ROUTE_PATH}>
            {() => (
              <SRBMPage data={window.PIPERIDER_SINGLE_REPORT_DATA || {}} />
            )}
          </Route>

          <Route>
            <NotFound />
          </Route>
        </Switch>
      </Router>
    </Suspense>
  );
}

function AppComparison() {
  return (
    <Suspense fallback={<Loading />}>
      <Router hook={useHashLocation as BaseLocationHook}>
        <Switch>
          <Route
            path="/"
            component={() => (
              <CRTablesListPage
                data={window.PIPERIDER_COMPARISON_REPORT_DATA}
              />
            )}
          />

          <Route path={COLUMN_DETAILS_ROUTE_PATH}>
            {({ tableName, columnName }) => (
              <CRColumnDetailsPage
                tableName={decodeURIComponent(tableName || '')}
                columnName={decodeURIComponent(columnName || '')}
                data={window.PIPERIDER_COMPARISON_REPORT_DATA || {}}
              />
            )}
          </Route>

          <Route path={ASSERTIONS_ROUTE_PATH}>
            {() => (
              <CRAssertionListPage
                data={window.PIPERIDER_COMPARISON_REPORT_DATA || {}}
              />
            )}
          </Route>

          <Route path={BM_ROUTE_PATH}>
            {() => (
              <CRBMPage data={window.PIPERIDER_COMPARISON_REPORT_DATA || {}} />
            )}
          </Route>

          <Route>
            <NotFound />
          </Route>
        </Switch>
      </Router>
    </Suspense>
  );
}

function AppReconcile() {
  return (
    <Suspense fallback={<Loading />}>
      <Router>
        <Switch>
          <Route
            path="/"
            component={() => (
              <RRTablesListPage data={window.PIPERIDER_RECONCILE_REPORT_DATA} />
            )}
          />

          <Route path={RECONCILE_COLUMNS_DETAILS_ROUTE_PATH}>
            {({ reconcileName, ruleName }) => (
              <RRColumnDetailsPage
                ruleName={decodeURIComponent(ruleName || '')}
                reconcileName={decodeURIComponent(reconcileName || '')}
                data={window.PIPERIDER_RECONCILE_REPORT_DATA || {}}
              />
            )}
          </Route>

          {/* todo: add assertions and bm metrics for reconcile */}

          <Route>
            <NotFound />
          </Route>
        </Switch>
      </Router>
    </Suspense>
  );
}

function App() {
  switch (process.env.REACT_APP_REPORT) {
    case 'SINGLE':
      return <AppSingle />;
    case 'COMPARISON':
      return <AppComparison />;
    case 'RECONCILE':
      return <AppReconcile />;
    default:
      return <AppSingle />;
  }
}

export default App;
