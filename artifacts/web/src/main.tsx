// @refresh reset
import { createRoot } from "react-dom/client";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import PreviewPage from "./pages/PreviewPage";
import Registrazione from "./pages/Registrazione";
import Pagamenti from "./pages/Pagamenti";
import { CartProvider } from "./lib/CartContext";
import "./index.css";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function Routes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/registrazione`}
      signUpUrl={`${basePath}/registrazione`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <CartProvider>
        <Switch>
          <Route path="/checkout" component={Checkout} />
          <Route path="/admin" component={Admin} />
          <Route path="/lavori/:id" component={PreviewPage} />
          <Route path="/registrazione/*?" component={Registrazione} />
          <Route path="/pagamenti" component={Pagamenti} />
          <Route component={App} />
        </Switch>
      </CartProvider>
    </ClerkProvider>
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
