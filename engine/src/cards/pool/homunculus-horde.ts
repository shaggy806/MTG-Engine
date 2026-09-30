import { defineCard } from "../define.js";

const TEXT = "Whenever you draw your second card each turn, create a token that's a copy of this creature.";

export default defineCard({
  name: "Homunculus Horde",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Homunculus"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
