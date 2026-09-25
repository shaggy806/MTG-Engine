import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever a creature you control deals combat damage to a player, you may draw a card.";
const ATTACK_TEXT = "{1}{U}, {T}: Creatures your opponents control attack this turn if able.";

export default defineCard({
  name: "Bident of Thassa",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment", "artifact"],
  text: `${DRAW_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: [],
      // A rule for the rest of the turn over every creature the opponents
      // control, including one that arrives later (rule 611.2c).
      effect: {
        kind: "restrict",
        filter: { type: "creature", controlledBy: "opponent" },
        restrictions: ["must-attack"],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
