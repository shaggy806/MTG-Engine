import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const DRAW_TEXT = "{1}{B}{B}, {T}: Draw a card, then you lose life equal to the number of cards in your hand.";

// The hand is counted after the draw, with nothing in between (the ruling).
export default defineCard({
  name: "Castle Locthwain",
  colors: [],
  types: ["land"],
  text: `This land enters tapped unless you control a Swamp.\n{T}: Add {B}.\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtype: "Swamp" }, atLeast: 1 },
      },
      text: "This land enters tapped unless you control a Swamp.",
    },
  ],
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: "{1}{B}{B}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: { cardsInHand: "you" } },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
