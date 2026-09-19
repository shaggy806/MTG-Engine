import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon's Rage Channeler",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 1,
  text:
    "Whenever you cast a noncreature spell, surveil 1.\n" +
    "Delirium — As long as there are four or more card types among cards in your graveyard, " +
    "this creature gets +2/+2, has flying, and attacks each combat if able.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, surveil 1.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "delirium" },
      grantPt: [2, 2],
      grantKeywords: ["flying"],
      restrictions: ["must-attack"],
      text:
        "Delirium — As long as there are four or more card types among cards in your graveyard, " +
        "this creature gets +2/+2, has flying, and attacks each combat if able.",
    },
  ],
});
