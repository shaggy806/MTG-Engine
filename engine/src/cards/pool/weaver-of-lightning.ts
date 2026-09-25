import { defineCard } from "../define.js";

export default defineCard({
  name: "Weaver of Lightning",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)\nWhenever you cast an instant or sorcery spell, this creature deals 1 damage to target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, this creature deals 1 damage to target creature an opponent controls.",
    },
  ],
});
