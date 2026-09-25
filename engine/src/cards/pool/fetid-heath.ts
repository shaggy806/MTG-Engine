import { defineCard } from "../define.js";

// A Shadowmoor filter land. Its hybrid activation cost keeps the second
// ability out of the auto-payer (AUTHORING §8), so it is activated by hand and
// its two mana float; the player picks {W}{W}, {W}{B} or {B}{B} there.
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
