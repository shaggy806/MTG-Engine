import { defineCard } from "../define.js";

export default defineCard({
  name: "Kiln Fiend",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Beast"],
  power: 1,
  toughness: 2,
  text: "Whenever you cast an instant or sorcery spell, this creature gets +3/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, this creature gets +3/+0 until end of turn.",
    },
  ],
});
