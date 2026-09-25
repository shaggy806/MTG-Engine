import { defineCard } from "../define.js";

export default defineCard({
  name: "Magmaw",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 4,
  text: "{1}, Sacrifice a nonland permanent: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: { notTypes: ["land"] } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}, Sacrifice a nonland permanent: This creature deals 1 damage to any target.",
    },
  ],
});
