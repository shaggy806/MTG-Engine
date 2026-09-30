import { defineCard } from "../define.js";

/** 1/1 colorless Eldrazi Scion with "Sacrifice this token: Add {C}." —
 * Warping Wail's token. */
export default defineCard({
  name: "Eldrazi Scion Token",
  art: "6ef7df0d-d7d6-463d-b452-32666973234a",
  types: ["creature"],
  subtypes: ["Eldrazi", "Scion"],
  power: 1,
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
