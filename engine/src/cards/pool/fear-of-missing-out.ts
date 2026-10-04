import { defineCard } from "../define.js";

// EDHREC rank 2484.
//
// Rulings:
//   [2024-09-20] If the target creature is an illegal target as Fear of Missing Out's last ability
//     tries to resolve, it won't resolve and none of its effects will happen. There won't be an
//     additional combat phase.
//   [2024-09-20] Fear of Missing Out's last ability doesn't give you any additional main phases.
//     This means that you will move directly from the end of combat step of one combat phase to
//     the beginning of combat step of the next one.
//
// Delirium is an intervening "if" (rule 603.4), asked as it triggers and again
// as it resolves. "The first time each turn" is Scourge of the Throne's: the
// extra combat it adds doesn't fire it again.

const ETB_TEXT = "When this creature enters, discard a card, then draw a card.";
const ATTACK_TEXT =
  "Delirium — Whenever this creature attacks for the first time each turn, if there are four or more card types among cards in your graveyard, untap target creature. After this phase, there is an additional combat phase.";

export default defineCard({
  name: "Fear of Missing Out",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment", "creature"],
  subtypes: ["Nightmare"],
  power: 2,
  toughness: 3,
  text: `${ETB_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "discard", target: "you", amount: 1 }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self", firstTimeEachTurn: true },
      condition: { kind: "delirium" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
