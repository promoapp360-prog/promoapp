// @refresh reset
import { createRoot } from "react-dom/client";
import { Switch, Route, Router as WouterRouter } from "wouter";
import PreviewPage from "./pages/PreviewPage";
import Preventivo from "./pages/Preventivo";
import ServiceLanding from "./pages/ServiceLanding";
import MenuDemo from "./pages/MenuDemo";
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
      {/* Le anteprime private dei lavori restano raggiungibili tramite il loro link. */}
      <Route path="/lavori/:id" component={PreviewPage} />
      {/* Alias mantenuto per non interrompere eventuali link già condivisi. */}
      <Route path="/preventivo" component={Preventivo} />
      <Route path="/siti-web">{() => <ServiceLanding service="siti-web" />}</Route>
      <Route path="/web-app">{() => <ServiceLanding service="web-app" />}</Route>
      <Route path="/menu-digitali">{() => <ServiceLanding service="menu-digitali" />}</Route>
      <Route path="/menu-demo" component={MenuDemo} />
      {/* Homepage esistente conservata e aggiornata, con il suo modulo recensioni. */}
      <Route path="/" component={Preventivo} />
      <Route component={Preventivo} />
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
