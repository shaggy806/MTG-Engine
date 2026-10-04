import { defineCard } from "../define.js";

// EDHREC rank 6216.
const DAMAGE_TEXT = "Brotherhood's End deals 3 damage to each creature and each planeswalker.";
const DESTROY_TEXT = "Destroy all artifacts with mana value 3 or less.";

// Storm's Wrath's sweep and Culling Ritual's mana-value destroy-all, as
// Bushwhack's choose-one.
export default defineCard({
  name: "Brotherhood's End",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: `Choose one —\n• ${DAMAGE_TEXT}\n• ${DESTROY_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: DAMAGE_TEXT,
        targets: [],
        effect: { kind: "damage-all", filter: { typesAnyOf: ["creature", "planeswalker"] }, amount: 3 },
      },
      {
        text: DESTROY_TEXT,
        targets: [],
        effect: { kind: "destroy-all", filter: { type: "artifact", manaValue: { op: "lte", n: 3 } } },
      },
    ],
  },
});
