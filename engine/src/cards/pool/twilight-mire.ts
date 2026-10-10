import { defineCard } from "../define.js";

// A Shadowmoor filter land. The auto-payer funds its hybrid activation cost
// from another source, as it does a Signet's (AUTHORING, the converter note);
// activated by hand, its two mana float and the player picks {B}{B}, {B}{G} or {G}{G} there.
export default defineCard({
  name: "Twilight Mire",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{B/G}, {T}: Add {B}{B}, {B}{G}, or {G}{G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{B/G}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 2 },
      resolve: null,
      text: "{B/G}, {T}: Add {B}{B}, {B}{G}, or {G}{G}.",
    },
  ],
});
