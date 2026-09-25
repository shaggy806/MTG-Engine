import { defineCard } from "../define.js";

// A Shadowmoor filter land. Its hybrid activation cost keeps the second
// ability out of the auto-payer (AUTHORING §8), so it is activated by hand and
// its two mana float; the player picks {R}{R}, {R}{W} or {W}{W} there.
export default defineCard({
  name: "Rugged Prairie",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{R/W}, {T}: Add {R}{R}, {R}{W}, or {W}{W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{R/W}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 2 },
      resolve: null,
      text: "{R/W}, {T}: Add {R}{R}, {R}{W}, or {W}{W}.",
    },
  ],
});
