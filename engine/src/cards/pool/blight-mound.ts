import { defineCard } from "../define.js";

// EDHREC rank 3833.
// Makes Pest → use "Pest Token".

export default defineCard({
  name: "Blight Mound",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Attacking Pests you control get +1/+0 and have menace.\nWhenever a nontoken creature you control dies, create a 1/1 black and green Pest creature token with \"When this token dies, you gain 1 life.\"",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { token: false, type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Pest Token", count: 1 },
      resolve: null,
      text: "Whenever a nontoken creature you control dies, create a 1/1 black and green Pest creature token with \"When this token dies, you gain 1 life.\"",
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Pest", attacking: true, controlledBy: "you" } },
      grantPt: [1, 0],
      grantKeywords: ["menace"],
      text: "Attacking Pests you control get +1/+0 and have menace.",
    },
  ],
});
