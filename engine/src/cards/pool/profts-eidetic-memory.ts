import { defineCard } from "../define.js";

const ENTER_TEXT = "When Proft's Eidetic Memory enters, draw a card.";
const COMBAT_TEXT =
  "At the beginning of combat on your turn, if you've drawn more than one card this turn, put X +1/+1 counters on target creature you control, where X is the number of cards you've drawn this turn minus one.";

// "More than one card" is an intervening-if (rule 603.4); X is read as it
// resolves.
export default defineCard({
  name: "Proft's Eidetic Memory",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\nYou have no maximum hand size.\n${COMBAT_TEXT}`,
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: { kind: "turn-stat", stat: "cards-drawn", who: "you", atLeast: 2 },
      targets: ["creature-you-control"],
      effect: {
        kind: "add-counter",
        target: 0,
        counter: "+1/+1",
        amount: { difference: [{ turnStat: "cards-drawn", who: "you" }, 1] },
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
