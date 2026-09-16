import { defineCard } from "../define.js";

export default defineCard({
  name: "Liliana's Standard Bearer",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 3,
  toughness: 1,
  keywords: ["flash"],
  text:
    "Flash\n" +
    "When Liliana's Standard Bearer enters, draw X cards, where X is the number " +
    "of creatures that died under your control this turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { creaturesDiedThisTurn: true } },
      resolve: null,
      text:
        "When Liliana's Standard Bearer enters, draw X cards, where X is the number " +
        "of creatures that died under your control this turn.",
    },
  ],
});
