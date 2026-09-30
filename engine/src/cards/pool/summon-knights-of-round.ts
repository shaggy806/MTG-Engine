import { defineCard } from "../define.js";

const KNIGHTS_TEXT = "I, II, III, IV — Create three 2/2 white Knight creature tokens.";
const ULTIMATE_TEXT =
  "V — Ultimate End — Other creatures you control get +2/+2 until end of turn. Put an indestructible counter on each of them.";
const OTHERS = { type: "creature", controlledBy: "you" } as const;

// Summon: Bahamut's shape: a Saga creature, sacrificed after its last
// chapter like any Saga.
export default defineCard({
  name: "Summon: Knights of Round",
  manaCost: "{6}{W}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["indestructible"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after V.)\n" +
    `${KNIGHTS_TEXT}\n${ULTIMATE_TEXT}\nIndestructible`,
  chapters: [
    {
      at: [1, 2, 3, 4],
      targets: [],
      effect: { kind: "create-token", token: "2/2 White Knight Token", count: 3 },
      resolve: null,
      text: KNIGHTS_TEXT,
    },
    {
      at: [5],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: OTHERS, power: 2, toughness: 2, duration: "end-of-turn", exceptSource: true },
          { kind: "add-counter-all", filter: OTHERS, counter: "indestructible", amount: 1, exceptSource: true },
        ],
      },
      resolve: null,
      text: ULTIMATE_TEXT,
    },
  ],
});
