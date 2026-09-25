import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// #259 in top-commanders.txt.
const FLIP_TEXT = "At the beginning of combat on your turn, flip a coin until you lose a flip.";
const DRAW_TEXT = "Whenever a player wins a coin flip, draw a card.";

export default defineCard({
  name: "Zndrsplt, Eye of Wisdom",
  manaCost: "{4}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Homunculus"],
  power: 1,
  toughness: 4,
  pairing: { kind: "partner-with", name: "Okaun, Eye of Chaos" },
  text:
    "Partner with Okaun, Eye of Chaos (When this creature enters, target player may put Okaun into " +
    `their hand from their library, then shuffle.)\n${FLIP_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    partnerWithTrigger("Okaun, Eye of Chaos"),
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "flip-coin", untilLose: true },
      resolve: null,
      text: FLIP_TEXT,
    },
    {
      trigger: { on: "wins-coin-flip", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
