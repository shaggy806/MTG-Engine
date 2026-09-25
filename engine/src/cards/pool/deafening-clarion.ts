import { defineCard } from "../define.js";

export default defineCard({
  name: "Deafening Clarion",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  types: ["sorcery"],
  text: "Choose one or both —\n• Deafening Clarion deals 3 damage to each creature.\n• Creatures you control gain lifelink until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Deafening Clarion deals 3 damage to each creature.",
        effect: { kind: "damage-all", amount: 3, filter: { type: "creature" } },
      },
      {
        text: "Creatures you control gain lifelink until end of turn.",
        effect: {
          kind: "grant-keyword-all",
          filter: { type: "creature", controlledBy: "you" },
          keyword: "lifelink",
          duration: "end-of-turn",
        },
      },
    ],
  },
});
