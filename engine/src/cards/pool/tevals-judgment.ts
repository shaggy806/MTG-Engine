import { defineCard } from "../define.js";

const TRIGGER_TEXT = "Whenever one or more cards leave your graveyard, choose one that hasn't been chosen this turn —";
const DRAW_MODE = "Draw a card.";
const TREASURE_MODE = "Create a Treasure token.";
const ZOMBIE_MODE = "Create a 2/2 black Zombie Druid creature token.";

// Once per simultaneous move out of the graveyard, however many cards. The
// mode is announced as the ability goes on the stack (rule 603.3c), so a
// fourth instance in a turn has nothing left to choose and is removed.
export default defineCard({
  name: "Teval's Judgment",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${TRIGGER_TEXT}\n• ${DRAW_MODE}\n• ${TREASURE_MODE}\n• ${ZOMBIE_MODE}`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        notChosenThisTurn: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: DRAW_MODE, effect: { kind: "draw", amount: 1 } },
          { text: TREASURE_MODE, effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
          { text: ZOMBIE_MODE, effect: { kind: "create-token", token: "Zombie Druid Token", count: 1 } },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${DRAW_MODE} ${TREASURE_MODE} ${ZOMBIE_MODE}`,
    },
  ],
});
