import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {U}{U}, {U}{R} or {R}{R} there.
export default defineCard({
  name: "Cascade Bluffs",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{U/R}, {T}: Add {U}{U}, {U}{R}, or {R}{R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{U/R}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 2 },
      resolve: null,
      text: "{U/R}, {T}: Add {U}{U}, {U}{R}, or {R}{R}.",
    },
  ],
});
