import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import App from "./App";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import PreviewPage from "./pages/PreviewPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Switch>
    <Route path="/checkout" component={Checkout} />
    <Route path="/admin" component={Admin} />
    <Route path="/lavori/:id" component={PreviewPage} />
    <Route component={App} />
  </Switch>
);
