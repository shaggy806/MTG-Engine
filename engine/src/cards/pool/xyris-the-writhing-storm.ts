import { defineCard } from "../define.js";

export default defineCard({
  name: "Xyris, the Writhing Storm",
  manaCost: "{2}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Leviathan"],
  power: 3,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever an opponent draws a card except the first one they draw in each of their draw " +
    "steps, create a 1/1 green Snake creature token.\n" +
    "Whenever Xyris deals combat damage to a player, you and that player each draw that many cards.",
  triggered: [
    {
      trigger: { on: "draws", who: "opponent", exceptFirstInDrawStep: true },
      targets: [],
      effect: { kind: "create-token", token: "Snake Token", count: 1 },
      resolve: null,
      text:
        "Whenever an opponent draws a card except the first one they draw in each of their draw " +
        "steps, create a 1/1 green Snake creature token.",
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { triggerValue: true } },
          { kind: "draw", amount: { triggerValue: true }, who: "trigger-player" },
        ],
      },
      resolve: null,
      text: "Whenever Xyris deals combat damage to a player, you and that player each draw that many cards.",
    },
  ],
});
