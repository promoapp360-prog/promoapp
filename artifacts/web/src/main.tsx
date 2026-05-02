import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import App from "./App";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Portfolio from "./pages/Portfolio";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Switch>
    <Route path="/checkout" component={Checkout} />
    <Route path="/admin" component={Admin} />
    <Route path="/portfolio" component={Portfolio} />
    <Route component={App} />
  </Switch>
);
