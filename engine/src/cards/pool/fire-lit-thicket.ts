import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {R}{R}, {R}{G} or {G}{G} there.
export default defineCard({
  name: "Fire-Lit Thicket",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{R/G}, {T}: Add {R}{R}, {R}{G}, or {G}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{R/G}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 2 },
      resolve: null,
      text: "{R/G}, {T}: Add {R}{R}, {R}{G}, or {G}{G}.",
    },
  ],
});
