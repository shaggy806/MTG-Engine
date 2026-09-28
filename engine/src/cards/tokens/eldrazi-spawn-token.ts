import { defineCard } from "../define.js";

// A 0/1 colorless Eldrazi Spawn with "Sacrifice this token: Add {C}." — no
// tap, so a summoning-sick one can pay. Chittering Dispatcher's token.
export default defineCard({
  name: "Eldrazi Spawn Token",
  art: "e32795e1-5548-43ef-8cd6-c605a19ef708",
  types: ["creature"],
  subtypes: ["Eldrazi", "Spawn"],
  power: 0,
  toughness: 1,
  text: "Sacrifice this token: Add {C}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "Sacrifice this token: Add {C}.",
    },
  ],
});
