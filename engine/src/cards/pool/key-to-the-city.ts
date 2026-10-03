import { defineCard } from "../define.js";

// "Up to one target creature": it may be activated with no target at all (its
// ruling); a creature already blocked stays blocked. The untap trigger fires
// in the untap step and goes on the stack with the upkeep's triggers, its
// {2} paid once at most (its rulings).
const EVADE_TEXT = "{T}, Discard a card: Up to one target creature can't be blocked this turn.";
const DRAW_TEXT = "Whenever this artifact becomes untapped, you may pay {2}. If you do, draw a card.";

export default defineCard({
  name: "Key to the City",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: `${EVADE_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, discard: { count: 1 } },
      targets: [{ kind: "optional", of: "creature" }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: EVADE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-untapped", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Pay {2} to draw a card?", cost: "{2}", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
