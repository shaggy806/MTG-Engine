import { defineCard } from "../define.js";

// EDHREC rank 2614.

const ENTER_TEXT = "When Vraska Joins Up enters, put a deathtouch counter on each creature you control.";
const DRAW_TEXT = "Whenever a legendary creature you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Vraska Joins Up",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // A deathtouch counter is a keyword counter (rule 122.1b).
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "deathtouch",
        amount: 1,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { supertype: "legendary", type: "creature" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
