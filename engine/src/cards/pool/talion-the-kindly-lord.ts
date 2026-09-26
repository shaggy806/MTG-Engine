import { defineCard } from "../define.js";

// #342 in top-commanders.txt.
//
// The number is the "as this enters" word (`chooseOnEnter`, "1" to "10"),
// read back as a number by the trigger's filter (the `chosenNumber` amount).
// A spell's mana value on the stack counts its X (the ruling), and a
// noncreature spell has no power or toughness to match. With no number
// chosen — Talion put onto the battlefield some way that didn't ask —
// nothing matches.
const TRIGGER_TEXT =
  "Whenever an opponent casts a spell with mana value, power, or toughness equal to the chosen " +
  "number, that player loses 2 life and you draw a card.";
const CHOSEN = { op: "eq", n: { amount: { chosenNumber: true } } } as const;

export default defineCard({
  name: "Talion, the Kindly Lord",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Noble"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\nAs Talion enters, choose a number between 1 and 10.\n${TRIGGER_TEXT}`,
  chooseOnEnter: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "opponent",
        filter: { anyOf: [{ manaValue: CHOSEN }, { power: CHOSEN }, { toughness: CHOSEN }] },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "trigger-controller" },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
