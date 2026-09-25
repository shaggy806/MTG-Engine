import { defineCard } from "../define.js";

export default defineCard({
  name: "Eloise, Nephalia Sleuth",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 4,
  toughness: 4,
  text: "Whenever another creature you control dies, investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")\nWhenever you sacrifice a token, surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "Whenever another creature you control dies, investigate.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { token: true } },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice a token, surveil 1.",
    },
  ],
});
