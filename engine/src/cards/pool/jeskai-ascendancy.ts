import { defineCard } from "../define.js";

// EDHREC rank 2818.

const PUMP_TEXT =
  "Whenever you cast a noncreature spell, creatures you control get +1/+1 until end of turn. Untap those creatures.";
const LOOT_TEXT = "Whenever you cast a noncreature spell, you may draw a card. If you do, discard a card.";
const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Jeskai Ascendancy",
  manaCost: "{U}{R}{W}",
  colors: ["W", "U", "R"],
  types: ["enchantment"],
  text: `${PUMP_TEXT}\n${LOOT_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: YOURS, power: 1, toughness: 1, duration: "end-of-turn" },
          { kind: "untap-all", filter: YOURS },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card, then discard a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 1 },
            { kind: "discard", target: "you", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
