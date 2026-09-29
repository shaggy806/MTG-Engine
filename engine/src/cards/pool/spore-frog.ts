import { defineCard } from "../define.js";

const TEXT = "Sacrifice this creature: Prevent all combat damage that would be dealt this turn.";

export default defineCard({
  name: "Spore Frog",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "prevent-all-combat-damage" },
      resolve: null,
      text: TEXT,
    },
  ],
});
