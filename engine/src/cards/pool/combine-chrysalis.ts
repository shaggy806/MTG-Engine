import { defineCard } from "../define.js";

// EDHREC rank 5617.
// Makes Beast → uses "Beast Token".
//
// Any token pays the sacrifice, not just a creature token (the ruling).
//
// Rulings:
//   [2021-06-18] You can sacrifice any token you control to activate the last ability, not just
//     creature tokens.

const FLYING_TEXT = "Creature tokens you control have flying.";
const BEAST_TEXT =
  "{2}{G}{U}, {T}, Sacrifice a token: Create a 4/4 green Beast creature token. Activate only as a sorcery.";

export default defineCard({
  name: "Combine Chrysalis",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["artifact"],
  text: `${FLYING_TEXT}\n${BEAST_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", token: true, controlledBy: "you" } },
      grantKeywords: ["flying"],
      text: FLYING_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{G}{U}", tap: true, sacrifice: { filter: { token: true } } },
      targets: [],
      effect: { kind: "create-token", token: "Beast Token", count: 1 },
      resolve: null,
      text: BEAST_TEXT,
      sorcerySpeed: true,
    },
  ],
});
