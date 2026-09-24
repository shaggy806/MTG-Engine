import { defineCard } from "../define.js";

// A 1/1 white Vampire **with lifelink** — Elenda, the Dusk Rose's token.
// Distinct from the black `1/1 Vampire Token`; the engine keys tokens by name.
export default defineCard({
  name: "Lifelink Vampire Token",
  art: "0484390e-1167-4407-84de-7ddc726e8926",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink",
});
