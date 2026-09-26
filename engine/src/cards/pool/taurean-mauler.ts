import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent casts a spell, you may put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Taurean Mauler",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 2,
  toughness: 2,
  keywords: ["changeling"],
  text: `Changeling (This card is every creature type.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a +1/+1 counter on Taurean Mauler?",
        effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
