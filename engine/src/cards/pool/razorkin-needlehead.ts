import { defineCard } from "../define.js";

const STRIKE_TEXT = "This creature has first strike during your turn.";
const DRAW_TEXT = "Whenever an opponent draws a card, this creature deals 1 damage to them.";

// Once per card drawn; "them" is the player who drew it — the drawn card's
// controller (`"trigger-controller"`), not a target.
export default defineCard({
  name: "Razorkin Needlehead",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 2,
  toughness: 2,
  text: `${STRIKE_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantKeywords: ["first-strike"],
      text: STRIKE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-controller" },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
