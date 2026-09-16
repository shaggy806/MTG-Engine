import { defineCard } from "../define.js";

export default defineCard({
  name: "Voice of Many",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 3,
  text:
    "When Voice of Many enters, draw a card for each opponent who controls fewer " +
    "creatures than you.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "draw",
        amount: { opponentsControllingFewer: { type: "creature" } },
      },
      resolve: null,
      text:
        "When Voice of Many enters, draw a card for each opponent who controls fewer " +
        "creatures than you.",
    },
  ],
});
