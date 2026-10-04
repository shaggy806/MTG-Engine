import { defineCard } from "../define.js";

// EDHREC rank 5031.

export default defineCard({
  name: "Mai, Scornful Striker",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Ally"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike\nWhenever a player casts a noncreature spell, they lose 2 life.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", noncreatureOnly: true },
      targets: [],
      // "They" is the caster — the spell's controller (Liesa's shape).
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: "Whenever a player casts a noncreature spell, they lose 2 life.",
    },
  ],
});
