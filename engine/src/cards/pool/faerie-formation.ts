import { defineCard } from "../define.js";

export default defineCard({
  name: "Faerie Formation",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "{3}{U}: Create a 1/1 blue Faerie creature token with flying. Draw a card.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Faerie Token", count: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "{3}{U}: Create a 1/1 blue Faerie creature token with flying. Draw a card.",
    },
  ],
});
