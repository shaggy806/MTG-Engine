import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Alliance — Whenever another creature you control enters, choose one that hasn't been chosen this turn —";
const MANA_MODE = "Add {G}{G}{G}.";
const COUNTERS_MODE = "Put a +1/+1 counter on each creature you control.";
const SCRY_MODE = "Scry 2, then draw a card.";

// #121 in top-commanders.txt. The modes are announced as the ability goes on
// the stack (rule 603.3c), so creatures entering together each take a
// different one; the record belongs to this object, whoever chose (the
// rulings), and a fourth instance in a turn has nothing left to choose.
export default defineCard({
  name: "Galadriel, Light of Valinor",
  manaCost: "{2}{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Noble"],
  power: 3,
  toughness: 3,
  text: `${TRIGGER_TEXT}\n• ${MANA_MODE}\n• ${COUNTERS_MODE}\n• ${SCRY_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        notChosenThisTurn: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: MANA_MODE, effect: { kind: "add-mana", mana: "G", amount: 3 } },
          {
            text: COUNTERS_MODE,
            effect: {
              kind: "add-counter-all",
              filter: { type: "creature", controlledBy: "you" },
              counter: "+1/+1",
              amount: 1,
            },
          },
          {
            text: SCRY_MODE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "scry", amount: 2 },
                { kind: "draw", amount: 1 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${MANA_MODE} ${COUNTERS_MODE} ${SCRY_MODE}`,
    },
  ],
});
