import { defineCard } from "../define.js";
import { persist } from "../helpers.js";

const ENTERS_TEXT = "Whenever this creature or another permanent enters from a graveyard, draw a card.";
const CAST_TEXT = "Whenever a player casts a spell from a graveyard, draw a card.";

// "Enters from a graveyard" is the permanent's `entry.from` (`enteredFrom`):
// a permanent spell cast from a graveyard enters from the stack, so only the
// cast trigger sees it, and a land played from a graveyard only the first
// (the rulings). River Kelpie entering from a graveyard sees itself, and sees
// another permanent entering with it (`who: "any"`, one entry event).
export default defineCard({
  name: "River Kelpie",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 3,
  text:
    `${ENTERS_TEXT}\n${CAST_TEXT}\n` +
    "Persist (When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield under its owner's control with a -1/-1 counter on it.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { enteredFrom: "graveyard" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ENTERS_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "any", from: "graveyard" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
    persist(),
  ],
});
