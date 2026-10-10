import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {W}{W}, {W}{B} or {B}{B} there.
export default defineCard({
  name: "Fetid Heath",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{W/B}, {T}: Add {W}{W}, {W}{B}, or {B}{B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{W/B}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 2 },
      resolve: null,
      text: "{W/B}, {T}: Add {W}{W}, {W}{B}, or {B}{B}.",
    },
  ],
});
