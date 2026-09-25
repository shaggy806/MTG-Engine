import { defineCard } from "../define.js";

export default defineCard({
  name: "Third Path Iconoclast",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 1,
  text: "Whenever you cast a noncreature spell, create a 1/1 colorless Soldier artifact creature token.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Artifact Token", count: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, create a 1/1 colorless Soldier artifact creature token.",
    },
  ],
});
