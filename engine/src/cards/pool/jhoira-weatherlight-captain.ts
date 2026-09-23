import { defineCard } from "../define.js";

export default defineCard({
  name: "Jhoira, Weatherlight Captain",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 3,
  toughness: 3,
  text:
    "Whenever you cast a historic spell, draw a card. (Artifacts, legendaries, and Sagas are historic.)",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        // Historic (rule 700.6): an artifact, a legendary, or a Saga.
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast a historic spell, draw a card.",
    },
  ],
});
