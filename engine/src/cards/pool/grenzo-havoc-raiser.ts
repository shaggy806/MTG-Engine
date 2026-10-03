import { defineCard } from "../define.js";

// "That player" is the player the creature dealt combat damage to. The card
// is exiled face up (the ruling) and may only be *cast* — a land stays put —
// this turn, at its normal timing, with any-colour spending for that cast
// alone (rule 118.14); left uncast it stays in exile (the rulings).
const TRIGGER_TEXT = "Whenever a creature you control deals combat damage to a player, choose one —";
const GOAD_MODE = "Goad target creature that player controls.";
const EXILE_MODE =
  "Exile the top card of that player's library. Until end of turn, you may cast that card and you may spend mana as though it were mana of any color to cast that spell.";

export default defineCard({
  name: "Grenzo, Havoc Raiser",
  manaCost: "{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Rogue"],
  power: 2,
  toughness: 2,
  text: `${TRIGGER_TEXT}\n• ${GOAD_MODE}\n• ${EXILE_MODE}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: GOAD_MODE,
            targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "creature" } }],
            effect: { kind: "goad", target: 0 },
          },
          {
            text: EXILE_MODE,
            effect: {
              kind: "impulse-exile",
              amount: 1,
              whose: "trigger-player",
              duration: "end-of-turn",
              castOnly: true,
              spendAs: "any-color",
            },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${GOAD_MODE} ${EXILE_MODE}`,
    },
  ],
});
