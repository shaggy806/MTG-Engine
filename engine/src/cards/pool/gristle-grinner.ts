import { defineCard } from "../define.js";

export default defineCard({
  name: "Gristle Grinner",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 3,
  text: "Whenever a creature dies, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever a creature dies, this creature gets +2/+2 until end of turn.",
    },
  ],
});
