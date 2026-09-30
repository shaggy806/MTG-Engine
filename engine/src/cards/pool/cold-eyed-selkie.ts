import { defineCard } from "../define.js";

const TEXT = "Whenever this creature deals combat damage to a player, you may draw that many cards.";

export default defineCard({
  name: "Cold-Eyed Selkie",
  manaCost: "{1}{G/U}{G/U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["islandwalk"],
  text: `Islandwalk (This creature can't be blocked as long as defending player controls an Island.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw that many cards?",
        effect: { kind: "draw", amount: { triggerValue: true } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
