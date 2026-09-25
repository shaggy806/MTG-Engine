import { defineCard } from "../define.js";

export default defineCard({
  name: "Barbarian Riftcutter",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Barbarian"],
  power: 3,
  toughness: 3,
  text: "{R}, Sacrifice this creature: Destroy target land.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{R}, Sacrifice this creature: Destroy target land.",
    },
  ],
});
