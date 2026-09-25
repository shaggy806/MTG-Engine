import { defineCard } from "../define.js";

export default defineCard({
  name: "Seshiro the Anointed",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Monk"],
  power: 3,
  toughness: 4,
  text: "Other Snake creatures you control get +2/+2.\nWhenever a Snake you control deals combat damage to a player, you may draw a card.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { subtype: "Snake" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever a Snake you control deals combat damage to a player, you may draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Snake" },
      grantPt: [2, 2],
      text: "Other Snake creatures you control get +2/+2.",
    },
  ],
});
