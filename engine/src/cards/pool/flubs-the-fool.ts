import { defineCard } from "../define.js";

// Top-commanders rank 50. "Play a land" is the special action (rule 305.1),
// not landfall: a land an effect puts onto the battlefield doesn't count. The
// hand is checked as the trigger resolves.
const rummage = {
  kind: "conditional",
  condition: { kind: "hand-size", atMost: 0 },
  then: { kind: "draw", amount: 1 },
  else: { kind: "discard", target: "you", amount: 1 },
} as const;

export default defineCard({
  name: "Flubs, the Fool",
  manaCost: "{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog", "Scout"],
  power: 0,
  toughness: 5,
  text:
    "You may play an additional land on each of your turns.\n" +
    "Whenever you play a land or cast a spell, draw a card if you have no cards in hand. Otherwise, discard a card.",
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: "You may play an additional land on each of your turns.",
    },
  ],
  triggered: [
    {
      trigger: { on: "plays-land", who: "you" },
      targets: [],
      effect: rummage,
      resolve: null,
      text:
        "Whenever you play a land or cast a spell, draw a card if you have no cards in hand. " +
        "Otherwise, discard a card.",
    },
    {
      // `otherOnly`: the spell being cast is in the trigger scan (that's how
      // cascade sees its own cast), so without it Flubs would rummage off
      // being cast herself, from the stack.
      trigger: { on: "cast-spell", who: "you", otherOnly: true },
      targets: [],
      effect: rummage,
      resolve: null,
      text:
        "Whenever you play a land or cast a spell, draw a card if you have no cards in hand. " +
        "Otherwise, discard a card.",
    },
  ],
});
