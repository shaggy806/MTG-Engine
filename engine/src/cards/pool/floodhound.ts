import { defineCard } from "../define.js";

export default defineCard({
  name: "Floodhound",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 1,
  toughness: 2,
  text: "{3}, {T}: Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "{3}, {T}: Investigate.",
    },
  ],
});
