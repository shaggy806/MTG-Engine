import { defineCard } from "../define.js";

const TEXT = "Whenever you cast an instant or sorcery spell, create a 1/1 blue Bird Illusion creature token with flying.";

export default defineCard({
  name: "Murmuring Mystic",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 5,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token", token: "Bird Illusion Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
