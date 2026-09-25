import { defineCard } from "../define.js";

export default defineCard({
  name: "Welder Automaton",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 1,
  text: "{3}{R}: This creature deals 1 damage to each opponent.",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "{3}{R}: This creature deals 1 damage to each opponent.",
    },
  ],
});
