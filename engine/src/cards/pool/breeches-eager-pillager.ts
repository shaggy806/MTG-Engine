import { defineCard } from "../define.js";

const TRIGGER_TEXT = "Whenever a Pirate you control attacks, choose one that hasn't been chosen this turn —";
const TREASURE_MODE = "Create a Treasure token.";
const BLOCK_MODE = "Target creature can't block this turn.";
const IMPULSE_MODE = "Exile the top card of your library. You may play it this turn.";

// With all three chosen this turn, a further instance is removed with no
// effect (the ruling); the exiled card is played under the usual timing.
export default defineCard({
  name: "Breeches, Eager Pillager",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Pirate"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike"],
  text: `First strike\n${TRIGGER_TEXT}\n• ${TREASURE_MODE}\n• ${BLOCK_MODE}\n• ${IMPULSE_MODE}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Pirate" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        notChosenThisTurn: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: TREASURE_MODE, effect: { kind: "create-token", token: "Treasure Token", count: 1 } },
          {
            text: BLOCK_MODE,
            targets: ["creature"],
            effect: { kind: "restrict", target: 0, restrictions: ["cant-block"] },
          },
          { text: IMPULSE_MODE, effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" } },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${TREASURE_MODE} ${BLOCK_MODE} ${IMPULSE_MODE}`,
    },
  ],
});
