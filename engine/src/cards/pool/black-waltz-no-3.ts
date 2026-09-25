import { defineCard } from "../define.js";

export default defineCard({
  name: "Black Waltz No. 3",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "deathtouch"],
  text: "Flying, deathtouch\nWhenever you cast a noncreature spell, Black Waltz No. 3 deals 2 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, Black Waltz No. 3 deals 2 damage to each opponent.",
    },
  ],
});
