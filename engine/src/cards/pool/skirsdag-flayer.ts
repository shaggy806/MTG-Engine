import { defineCard } from "../define.js";

export default defineCard({
  name: "Skirsdag Flayer",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{3}{B}, {T}, Sacrifice a Human: Destroy target creature.",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: true, sacrifice: { filter: { subtype: "Human" } } },
      targets: ["creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{3}{B}, {T}, Sacrifice a Human: Destroy target creature.",
    },
  ],
});
