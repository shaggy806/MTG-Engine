import { defineCard } from "../define.js";

const COST_TEXT = "Blue spells you cast cost {1} less to cast.";
const MILL_TEXT = "If an opponent would mill one or more cards, they mill that many cards plus four instead.";
const ACTIVATE_TEXT = "{4}{U}{U}, {T}: Each opponent mills cards equal to the number of cards in your hand.";

// Two of them add eight (its ruling). Beside a mill multiplier (Bruvac) the
// multiplier goes first — see `MillMultiplierReplacement`.
export default defineCard({
  name: "The Water Crystal",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${MILL_TEXT}\n${ACTIVATE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { colors: ["U"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: { event: "would-mill", who: "opponent", plus: 4 },
      text: MILL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{U}{U}", tap: true },
      targets: [],
      effect: { kind: "mill", target: "each-opponent", amount: { cardsInHand: "you" } },
      resolve: null,
      text: ACTIVATE_TEXT,
    },
  ],
});
