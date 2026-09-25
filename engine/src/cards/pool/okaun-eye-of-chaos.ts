import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// #258 in top-commanders.txt.
const FLIP_TEXT = "At the beginning of combat on your turn, flip a coin until you lose a flip.";
const DOUBLE_TEXT = "Whenever a player wins a coin flip, double Okaun's power and toughness until end of turn.";

export default defineCard({
  name: "Okaun, Eye of Chaos",
  manaCost: "{4}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cyclops", "Berserker"],
  power: 3,
  toughness: 3,
  pairing: { kind: "partner-with", name: "Zndrsplt, Eye of Wisdom" },
  text:
    "Partner with Zndrsplt, Eye of Wisdom (When this creature enters, target player may put Zndrsplt " +
    `into their hand from their library, then shuffle.)\n${FLIP_TEXT}\n${DOUBLE_TEXT}`,
  triggered: [
    partnerWithTrigger("Zndrsplt, Eye of Wisdom"),
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
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { powerOf: "source", doubling: true },
        toughness: { toughnessOf: "source", doubling: true },
        duration: "end-of-turn",
      },
      resolve: null,
      text: DOUBLE_TEXT,
    },
  ],
});
