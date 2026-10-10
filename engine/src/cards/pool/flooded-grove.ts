import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {G}{G}, {G}{U} or {U}{U} there.
export default defineCard({
  name: "Flooded Grove",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{G/U}, {T}: Add {G}{G}, {G}{U}, or {U}{U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{G/U}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 2 },
      resolve: null,
      text: "{G/U}, {T}: Add {G}{G}, {G}{U}, or {U}{U}.",
    },
  ],
});
