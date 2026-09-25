import { defineCard } from "../define.js";

export default defineCard({
  name: "Anaba Shaman",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{R}, {T}: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{R}", tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{R}, {T}: This creature deals 1 damage to any target.",
    },
  ],
});
