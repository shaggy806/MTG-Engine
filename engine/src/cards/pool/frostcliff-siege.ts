import { defineCard } from "../define.js";

const JESKAI_TEXT = "Jeskai — Whenever one or more creatures you control deal combat damage to a player, draw a card.";
const TEMUR_TEXT = "Temur — Creatures you control get +1/+0 and have trample and haste.";

// Frontier Siege's shape: each mode is gated on the word chosen as it
// entered. Jeskai draws once for each player those creatures damaged.
export default defineCard({
  name: "Frostcliff Siege",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose Jeskai or Temur.\n• ${JESKAI_TEXT}\n• ${TEMUR_TEXT}`,
  chooseOnEnter: ["Jeskai", "Temur"],
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      condition: { kind: "chosen-on-enter", value: "Jeskai" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: JESKAI_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "chosen-on-enter", value: "Temur" },
      grantPt: [1, 0],
      grantKeywords: ["trample", "haste"],
      text: TEMUR_TEXT,
    },
  ],
});
