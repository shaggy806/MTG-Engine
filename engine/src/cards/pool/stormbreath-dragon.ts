import { defineCard } from "../define.js";

const MONSTROSITY_TEXT =
  "{5}{R}{R}: Monstrosity 3. (If this creature isn't monstrous, put three +1/+1 counters on it and it becomes monstrous.)";
const MONSTROUS_TEXT =
  "When this creature becomes monstrous, it deals damage to each opponent equal to the number of cards in that player's hand.";

// Each opponent's hand is counted as the trigger resolves (the ruling), and
// the damage to all of them is one event.
export default defineCard({
  name: "Stormbreath Dragon",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: `Flying, haste, protection from white\n${MONSTROSITY_TEXT}\n${MONSTROUS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["W"] },
      text: "Protection from white",
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{R}{R}", tap: false },
      targets: [],
      effect: { kind: "monstrosity", amount: 3 },
      resolve: null,
      text: MONSTROSITY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "becomes-monstrous", who: "self" },
      targets: [],
      effect: { kind: "damage", who: "each-opponent", amount: { cardsInHand: "each" } },
      resolve: null,
      text: MONSTROUS_TEXT,
    },
  ],
});
