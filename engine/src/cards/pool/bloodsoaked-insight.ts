import { defineCard } from "../define.js";

// EDHREC rank 2709.
//
// Rulings:
//   [2024-06-07] You pay all costs and follow all normal timing rules for cards played with the
//     permission granted by Bloodsoaked Insight. For example, if one of the exiled cards is a land
//     card, you may play it only during your main phase while the stack is empty.
//   [2024-06-07] If an effect allows you to play a land or cast a spell from among a group of
//     cards, you may play or cast a modal double-faced card with any face that fits the criteria
//     of that effect.
//
// A modal double-faced card (sorcery // land) — its back face, Sanguine Morass,
// is a land you play instead. The reduction is Rakdos, Lord of Riots' amount
// (life lost by opponents this turn, summed) as a self reduction with no "if";
// the exile is Outrageous Robbery's impulse from a target opponent's library,
// face up, until the end of your next turn (Reckless Impulse's duration).
const COST_TEXT = "This spell costs {1} less to cast for each 1 life your opponents have lost this turn.";
const EXILE_TEXT =
  "Target opponent exiles the top three cards of their library. Until the end of your next turn, you may play those cards. If you cast a spell this way, mana of any type can be spent to cast it.";

export default defineCard({
  name: "Bloodsoaked Insight",
  manaCost: "{5}{B/R}{B/R}",
  colors: ["B", "R"],
  types: ["sorcery"],
  text: `${COST_TEXT}\n${EXILE_TEXT}`,
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { turnStat: "life-lost", who: "opponent" },
  },
  targets: ["opponent"],
  effect: {
    kind: "impulse-exile",
    amount: 3,
    whose: 0,
    duration: "your-next-turn",
    spendAs: "any-type",
  },
  faces: ["Bloodsoaked Insight", "Sanguine Morass"],
});
