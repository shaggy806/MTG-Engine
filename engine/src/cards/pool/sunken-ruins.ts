import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {U}{U}, {U}{B} or {B}{B} there.
export default defineCard({
  name: "Sunken Ruins",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{U/B}, {T}: Add {U}{U}, {U}{B}, or {B}{B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{U/B}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 2 },
      resolve: null,
      text: "{U/B}, {T}: Add {U}{U}, {U}{B}, or {B}{B}.",
    },
  ],
});
