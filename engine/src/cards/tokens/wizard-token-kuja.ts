import { defineCard } from "../define.js";

// Kuja, Genome Sorcerer's 0/1 black Wizard.
const TEXT = "Whenever you cast a noncreature spell, this token deals 1 damage to each opponent.";

export default defineCard({
  name: "Wizard Token (Kuja)",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wizard"],
  power: 0,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
