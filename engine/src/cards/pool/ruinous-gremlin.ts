import { defineCard } from "../define.js";

export default defineCard({
  name: "Ruinous Gremlin",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Gremlin"],
  power: 1,
  toughness: 1,
  text: "{2}{R}, Sacrifice this creature: Destroy target artifact.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{2}{R}, Sacrifice this creature: Destroy target artifact.",
    },
  ],
});
