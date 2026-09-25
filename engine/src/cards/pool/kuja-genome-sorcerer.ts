import { defineCard } from "../define.js";

// #58 in top-commanders.txt. Transforms into Trance Kuja, Fate Defied.
//
// "Then if you control four or more Wizards" is checked after the token is
// made, so the new Wizard counts, and Kuja (a Wizard) counts himself.
const TRIGGER_TEXT =
  "At the beginning of your end step, create a tapped 0/1 black Wizard creature token with " +
  '"Whenever you cast a noncreature spell, this token deals 1 damage to each opponent." Then if ' +
  "you control four or more Wizards, transform Kuja.";

export default defineCard({
  name: "Kuja, Genome Sorcerer",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Mutant", "Wizard"],
  power: 3,
  toughness: 4,
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Wizard Token (Kuja)", count: 1, tapped: true },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { subtype: "Wizard" }, atLeast: 4 },
            then: { kind: "transform", target: "source" },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  faces: ["Kuja, Genome Sorcerer", "Trance Kuja, Fate Defied"],
  transform: true,
});
