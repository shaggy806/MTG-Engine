import { defineCard } from "../define.js";

const TEXT =
  "Whenever this creature deals combat damage to a player, it deals that much damage to each creature that player controls.";

// The second damage isn't combat damage (the ruling).
export default defineCard({
  name: "Balefire Dragon",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "damage-all",
        filter: { type: "creature" },
        amount: { triggerValue: true },
        whose: "trigger-player",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
