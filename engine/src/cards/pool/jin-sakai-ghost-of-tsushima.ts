import { defineCard } from "../define.js";

const DAMAGE_TEXT = "Whenever Jin Sakai deals combat damage to a player, draw a card.";
const ATTACK_TEXT =
  "Whenever a creature you control attacks a player, if no other creatures are attacking that player, choose one —";
const STANDOFF_MODE = "Standoff — It gains double strike until end of turn.";
const GHOST_MODE = "Ghost — It can't be blocked this turn.";

// #122 in top-commanders.txt. "If no other creatures are attacking that
// player" is an intervening-if (rule 603.4), asked again as it resolves.
export default defineCard({
  name: "Jin Sakai, Ghost of Tsushima",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Samurai"],
  power: 2,
  toughness: 4,
  text: `${DAMAGE_TEXT}\n${ATTACK_TEXT}\n• ${STANDOFF_MODE}\n• ${GHOST_MODE}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
    {
      trigger: { on: "attacks", who: "you-control", defender: "player", aloneAgainstDefender: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: STANDOFF_MODE,
            effect: { kind: "grant-keyword", target: "trigger-object", keyword: "double-strike", duration: "end-of-turn" },
          },
          {
            text: GHOST_MODE,
            effect: { kind: "grant-keyword", target: "trigger-object", keyword: "unblockable", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: `${ATTACK_TEXT} ${STANDOFF_MODE} ${GHOST_MODE}`,
    },
  ],
});
