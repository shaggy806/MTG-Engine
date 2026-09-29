import { defineCard } from "../define.js";

const COUNTER_TEXT = "Whenever a player casts a spell, if no mana was spent to cast it, counter that spell.";
const DRAW_TEXT = "{1}, {T}, Sacrifice this artifact: Draw a card.";

// Mana spent on any part of the cost — a flashback cost, kicker, a tax —
// is mana spent (the rulings); a spell paid by convoke or life alone isn't.
export default defineCard({
  name: "Vexing Bauble",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: `${COUNTER_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", filter: { manaSpent: { op: "eq", n: 0 } } },
      targets: [],
      effect: { kind: "counter", target: "trigger-object" },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
