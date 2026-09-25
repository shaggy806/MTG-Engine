import { defineCard } from "../define.js";

export default defineCard({
  name: "Sage of Lat-Nam",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 2,
  text: "{T}, Sacrifice an artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice an artifact: Draw a card.",
    },
  ],
});
