// @refresh reset
import { createRoot } from "react-dom/client";
import { Switch, Route, Router as WouterRouter } from "wouter";
import PreviewPage from "./pages/PreviewPage";
import Preventivo from "./pages/Preventivo";
import "./index.css";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Routes() {
  return (
    <Switch>
      {/* Le anteprime private dei lavori restano raggiungibili tramite il loro link. */}
      <Route path="/lavori/:id" component={PreviewPage} />
      {/* Alias mantenuto per non interrompere eventuali link già condivisi. */}
      <Route path="/preventivo" component={Preventivo} />
      {/* La landing è l'unica pagina pubblica del sito. */}
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
    <Routes />
  </WouterRouter>
);
