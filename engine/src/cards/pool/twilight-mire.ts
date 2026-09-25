import { defineCard } from "../define.js";

// A Shadowmoor filter land. Its hybrid activation cost keeps the second
// ability out of the auto-payer (AUTHORING §8), so it is activated by hand and
// its two mana float; the player picks {B}{B}, {B}{G} or {G}{G} there.
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
