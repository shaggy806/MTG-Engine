import { defineCard } from "../define.js";

export default defineCard({
  name: "Inspired Sphinx",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When Inspired Sphinx enters, draw cards equal to the number of opponents you have.\n" +
    "{3}{U}: Create a 1/1 colorless Thopter artifact creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { countPlayers: "each-opponent" } },
      resolve: null,
      text: "When Inspired Sphinx enters, draw cards equal to the number of opponents you have.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "{3}{U}: Create a 1/1 colorless Thopter artifact creature token with flying.",
    },
  ],
});
