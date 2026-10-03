import { defineCard } from "../define.js";

// The untap trigger fires in the untap step and goes on the stack with the
// upkeep's triggers, its {2} paid once at most; the cast trigger resolves
// before the spell, countered or not; a creature already blocked stays
// blocked (its rulings).
const UNTAP_TEXT = "Whenever this creature becomes untapped, you may pay {2}. If you do, draw a card.";
const CAST_TEXT = "Whenever an opponent casts a spell from anywhere other than their hand, draw a card.";
const EVADE_TEXT = "Discard a card: This creature can't be blocked this turn.";

export default defineCard({
  name: "Ghostly Pilferer",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit", "Rogue"],
  power: 2,
  toughness: 1,
  text: `${UNTAP_TEXT}\n${CAST_TEXT}\n${EVADE_TEXT}`,
  triggered: [
    {
      trigger: { on: "becomes-untapped", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Pay {2} to draw a card?", cost: "{2}", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: UNTAP_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "opponent", notFrom: "hand" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: EVADE_TEXT,
    },
  ],
});
