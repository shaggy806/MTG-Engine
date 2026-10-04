import { defineCard } from "../define.js";

// EDHREC rank 6173.
//
// Rulings:
//   [2024-04-12] Rumbleweed's first ability doesn't change its mana value, which is always 11.
//   [2024-04-12] Rumbleweed's last ability affects only creatures you control at the time it
//     resolves. Creatures you begin to control later in the turn and noncreature permanents that
//     become creatures later in the turn won't get +3/+3 or gain trample.

const ENTER_TEXT = "When this creature enters, other creatures you control get +3/+3 and gain trample until end of turn.";
const CREATURES_YOU_CONTROL = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Rumbleweed",
  manaCost: "{10}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Elemental"],
  power: 8,
  toughness: 8,
  keywords: ["reach", "vigilance", "trample"],
  text: `This spell costs {1} less to cast for each land card in your graveyard.\nReach, vigilance, trample\n${ENTER_TEXT}`,
  selfCostReduction: {
    // Unconditional: the same always-true gate Karador uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { cardsInGraveyard: { type: "land" } },
  },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Pippin, Warden of Isengard's shape: locked in as it resolves.
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: CREATURES_YOU_CONTROL,
            power: 3,
            toughness: 3,
            duration: "end-of-turn",
            exceptSource: true,
          },
          {
            kind: "grant-keyword-all",
            filter: CREATURES_YOU_CONTROL,
            keyword: "trample",
            duration: "end-of-turn",
            exceptSource: true,
          },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
