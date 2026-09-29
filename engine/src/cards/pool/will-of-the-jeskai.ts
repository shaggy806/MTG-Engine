import { defineCard } from "../define.js";

const WHEEL_TEXT = "Each player may discard their hand and draw five cards.";
const FLASHBACK_TEXT =
  "Each instant and sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost.";

// "Choose both" while you control a commander — anyone's — is `maxModesIf`,
// as for the rest of the cycle. Each player is asked in turn order.
export default defineCard({
  name: "Will of the Jeskai",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Choose one. If you control a commander as you cast this spell, you may choose both instead.\n" +
    `• ${WHEEL_TEXT}\n• ${FLASHBACK_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    maxModesIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 }, maxModes: 2 },
    modes: [
      {
        text: WHEEL_TEXT,
        targets: [],
        effect: {
          kind: "each-player-may",
          who: "each-player",
          prompt: "Discard your hand and draw five cards?",
          effect: {
            kind: "sequence",
            effects: [
              { kind: "discard-hand", who: "you" },
              { kind: "draw", amount: 5 },
            ],
          },
        },
      },
      {
        text: FLASHBACK_TEXT,
        targets: [],
        effect: { kind: "grant-flashback-all", filter: { typesAnyOf: ["instant", "sorcery"] } },
      },
    ],
  },
});
