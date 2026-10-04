import { defineCard } from "../define.js";

// EDHREC rank 6009.

const TEXT = "Whenever you draw your second card each turn, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Faerie Vandal",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 1,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\nFlying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
