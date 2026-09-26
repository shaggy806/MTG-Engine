import { ward } from "../helpers.js";
import { defineCard } from "../define.js";

// #451 in top-commanders.txt.
//
// "If you've cast both a creature spell and a noncreature spell this turn"
// asks of the spells cast this turn as they were cast: an Adventure cast as
// its instant half was a noncreature spell, though a creature card sits in
// exile after.
const COMBAT_TEXT =
  "At the beginning of combat on your turn, if you've cast both a creature spell and a noncreature spell this " +
  "turn, draw a card and put two +1/+1 counters on Eshki Dragonclaw.";

export default defineCard({
  name: "Eshki Dragonclaw",
  manaCost: "{1}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "trample"],
  text: `Vigilance, trample, ward {1}\n${COMBAT_TEXT}`,
  triggered: [
    ward({ mana: "{1}" }),
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: {
        kind: "all",
        of: [
          { kind: "cast-this-turn", filter: { type: "creature" } },
          { kind: "cast-this-turn", filter: { notTypes: ["creature"] } },
        ],
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
