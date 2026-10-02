import { defineCard } from "../define.js";

// A 1/1 white Soldier **with lifelink** — Emmara, Soul of the Accord's token.
// Distinct from the plain `Soldier Token`; the engine keys tokens by name.
export default defineCard({
  name: "Lifelink Soldier Token",
  art: "45907b16-af17-4237-ab38-9d7537fd30e8",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
