import { defineCard } from "../define.js";

const TEXT = "Whenever you cast an instant or sorcery spell, create a 1/1 red Elemental creature token.";

export default defineCard({
  name: "Young Pyromancer",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token", token: "1/1 Red Elemental Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
