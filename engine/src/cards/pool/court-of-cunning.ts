import { defineCard } from "../define.js";

const UPKEEP_TEXT =
  "At the beginning of your upkeep, any number of target players each mill two cards. If you're the " +
  "monarch, each of those players mills ten cards instead.";

// Whether you're the monarch is asked as the ability resolves; the chosen
// players mill at once.
export default defineCard({
  name: "Court of Cunning",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text:
    "When this enchantment enters, you become the monarch.\n" +
    `${UPKEEP_TEXT} (To mill a card, a player puts the top card of their library into their graveyard.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When this enchantment enters, you become the monarch.",
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "any-number", of: "player" }],
      effect: {
        kind: "conditional",
        condition: { kind: "monarch", who: "you" },
        then: { kind: "for-each-target", from: 0, effect: { kind: "mill", target: 0, amount: 10 }, simultaneous: true },
        else: { kind: "for-each-target", from: 0, effect: { kind: "mill", target: 0, amount: 2 }, simultaneous: true },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
