import { defineCard } from "../define.js";

const DIES_TEXT = "When this creature dies, choose one —";
const SHRINK_MODE = "Target creature an opponent controls gets -1/-1 until end of turn.";
const TREASURE_MODE = "Create a Treasure token.";

export default defineCard({
  name: "Shambling Ghast",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text:
    `${DIES_TEXT}\n• ${SHRINK_MODE}\n` +
    `• ${TREASURE_MODE} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: SHRINK_MODE,
            targets: ["creature-an-opponent-controls"],
            effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
          },
          { text: TREASURE_MODE, effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
        ],
      },
      resolve: null,
      text: `${DIES_TEXT} ${SHRINK_MODE} ${TREASURE_MODE}`,
    },
  ],
});
