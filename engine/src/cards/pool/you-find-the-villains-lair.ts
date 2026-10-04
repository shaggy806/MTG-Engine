import { defineCard } from "../define.js";

// EDHREC rank 5852.

const FOIL_MODE = "Foil Their Scheme — Counter target spell.";
const LEARN_MODE = "Learn Their Secrets — Draw two cards, then discard two cards.";

export default defineCard({
  name: "You Find the Villains' Lair",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Choose one —\n• ${FOIL_MODE}\n• ${LEARN_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: FOIL_MODE,
        targets: ["spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: LEARN_MODE,
        effect: {
          kind: "sequence",
          effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 2 }],
        },
      },
    ],
  },
});
