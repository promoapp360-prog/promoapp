// @refresh reset
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import PreviewPage from "./pages/PreviewPage";
import PortfolioPage from "./pages/PortfolioPage";
import Preventivo from "./pages/Preventivo";
import ServiceLanding from "./pages/ServiceLanding";
import SEOServicePage from "./pages/SEOServicePage";
import LocalSeoPage from "./pages/LocalSeoPage";
import NotFound from "./pages/not-found";
import MenuDemo from "./pages/MenuDemo";
import SectorLanding from "./pages/SectorLanding";
import ThankYou from "./pages/ThankYou";
import SiteControl from "./pages/SiteControl";
const Admin = lazy(() => import("./pages/Admin"));
import WhatsAppLanding from "./pages/WhatsAppLanding";
import CookieConsent from "./components/marketing/CookieConsent";
import PageSEO from "./components/marketing/PageSEO";
import { setBaseUrl } from "@workspace/api-client-react";
import { initTracking } from "./lib/analytics";
import "./index.css";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
setBaseUrl(basePath);
void initTracking();

function Routes() {
  return (
    <Switch>
      <Route path="/lavori" component={PortfolioPage} />
      {/* Le anteprime private dei lavori restano raggiungibili tramite il loro link. */}
      <Route path="/lavori/:id" component={PreviewPage} />
      {/* Alias mantenuto per non interrompere eventuali link già condivisi. */}
      <Route path="/preventivo" component={Preventivo} />
      <Route path="/whatsapp" component={WhatsAppLanding} />
      <Route path="/siti-web">{() => <ServiceLanding service="siti-web" />}</Route>
      <Route path="/sitiweb">{() => <Redirect to={`/siti-web${window.location.search}`} replace />}</Route>
      <Route path="/web-app">{() => <Redirect to={`/gestionali${window.location.search}`} replace />}</Route>
      <Route path="/gestionali">{() => <SEOServicePage pagePath="/gestionali" />}</Route>
      <Route path="/app-prenotazioni">{() => <SEOServicePage pagePath="/app-prenotazioni" />}</Route>
      <Route path="/menu-digitali">{() => <ServiceLanding service="menu-digitali" />}</Route>
      <Route path="/siti-web-milano">{() => <LocalSeoPage pagePath="/siti-web-milano" />}</Route>
      <Route path="/menu-digitale">{() => <Redirect to={`/menu-digitali${window.location.search}`} replace />}</Route>
      <Route path="/menu-demo" component={MenuDemo} />
      <Route path="/controllo-sito" component={SiteControl} />
      <Route path="/per/:slug">{(params) => <SectorLanding slug={params.slug} />}</Route>
      <Route path="/grazie" component={ThankYou} />
      <Route path="/gestione-contatti">{() => <Redirect to="/admin" replace />}</Route>
      <Route path="/admin/controlli">{() => <Suspense fallback={<p>Caricamento area riservata…</p>}><Admin initialTab="controls" /></Suspense>}</Route>
      <Route path="/admin">{() => <Suspense fallback={<p>Caricamento area riservata…</p>}><Admin initialTab="overview" /></Suspense>}</Route>
      {/* Homepage esistente conservata e aggiornata, con il suo modulo recensioni. */}
      <Route path="/" component={Preventivo} />
      <Route component={NotFound} />
    </Switch>
  );
}

const container = document.getElementById("root")!;
const existingRoot = (container as any).__reactRoot;
const root = existingRoot ?? createRoot(container);
if (!existingRoot) (container as any).__reactRoot = root;

root.render(
  <WouterRouter base={basePath}>
    <PageSEO />
    <Routes />
    <CookieConsent />
  </WouterRouter>
);
