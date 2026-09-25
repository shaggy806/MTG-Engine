import { defineCard } from "../define.js";

export default defineCard({
  name: "Lunatic Pandora",
  manaCost: "{1}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "{2}, {T}: Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)\n{6}, {T}, Sacrifice Lunatic Pandora: Destroy target nonland permanent.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Surveil 1.",
    },
    {
      cost: { mana: "{6}", tap: true, sacrifice: "self" },
      targets: ["nonland-permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{6}, {T}, Sacrifice Lunatic Pandora: Destroy target nonland permanent.",
    },
  ],
});
