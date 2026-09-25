import { defineCard } from "../define.js";

export default defineCard({
  name: "Whispering Wizard",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 2,
  text: "Whenever you cast a noncreature spell, create a 1/1 white Spirit creature token with flying. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, create a 1/1 white Spirit creature token with flying. This ability triggers only once each turn.",
      oncePerTurn: true,
    },
  ],
});
