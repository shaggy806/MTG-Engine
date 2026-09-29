import { defineCard } from "../define.js";

// "Permanents you don't own" are those an opponent owns: every other player
// is an opponent (no teams).
const END_TEXT =
  "At the beginning of your end step, if you control three or more permanents you don't own, draw three cards.";

export default defineCard({
  name: "Agent of Treachery",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 3,
  text: `When this creature enters, gain control of target permanent.\n${END_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "gain-control", target: 0, untilEndOfTurn: false },
      resolve: null,
      text: "When this creature enters, gain control of target permanent.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "controls", filter: { ownedBy: "opponent" }, atLeast: 3 },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
