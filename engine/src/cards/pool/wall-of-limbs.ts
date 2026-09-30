import { defineCard } from "../define.js";

const GAIN_TEXT = "Whenever you gain life, put a +1/+1 counter on this creature.";
const SAC_TEXT = "{5}{B}{B}, Sacrifice this creature: Target player loses X life, where X is this creature's power.";

// Its power as it was sacrificed (rule 608.2h).
export default defineCard({
  name: "Wall of Limbs",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: `Defender (This creature can't attack.)\n${GAIN_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GAIN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{B}{B}", tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "lose-life", target: 0, amount: { powerOf: "source" } },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
