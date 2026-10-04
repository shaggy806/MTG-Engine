import { defineCard } from "../define.js";

// EDHREC rank 3940.
//
// The lands are counted as the ability resolves.
const ATTACK_TEXT = "Whenever this creature attacks, it gets +1/+1 until end of turn for each land you control.";

export default defineCard({
  name: "Rampaging Brontodon",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 7,
  toughness: 7,
  keywords: ["trample"],
  text: `Trample\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { countOf: { type: "land", controlledBy: "you" } },
        toughness: { countOf: { type: "land", controlledBy: "you" } },
        duration: "end-of-turn",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
