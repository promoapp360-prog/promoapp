// Informational HTML pages do not mount React. Reuse Google tracking and the
// saved consent without adding UI, a second loader or Meta tracking to them.
import { initTracking, trackPage } from "./analytics";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");
trackPage(window.location.pathname.slice(base.length) || "/");
void initTracking({ googleOnly: true });
