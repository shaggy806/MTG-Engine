import { defineCard } from "../define.js";

// A 1/1 white Soldier **with lifelink** — Emmara, Soul of the Accord's token.
// Distinct from the plain `Soldier Token`; the engine keys tokens by name.
export default defineCard({
  name: "Lifelink Soldier Token",
  art: "https://scryfall.com/card/tgrn/2/soldier",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
