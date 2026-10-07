import QRCode from "qrcode";
import { writeFile } from "node:fs/promises";
const svg = await QRCode.toString("https://www.promoapp.it/menu-demo", {
  type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#16123f", light: "#ffffff" },
});
await writeFile(new URL("../public/menu-demo-qr.svg", import.meta.url), svg);
