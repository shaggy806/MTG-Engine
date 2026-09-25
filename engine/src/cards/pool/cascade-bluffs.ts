import { defineCard } from "../define.js";

// A Shadowmoor filter land. Its hybrid activation cost keeps the second
// ability out of the auto-payer (AUTHORING §8), so it is activated by hand and
// its two mana float; the player picks {U}{U}, {U}{R} or {R}{R} there.
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
