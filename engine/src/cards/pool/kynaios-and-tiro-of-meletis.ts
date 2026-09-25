import { defineCard } from "../define.js";

// #128 in top-commanders.txt.
//
// Every player is asked in turn from the active player (you included); a
// player with no land in hand isn't asked, and didn't. Only opponents who
// didn't draw (`resultsFor`).
const TRIGGER_TEXT =
  "At the beginning of your end step, draw a card. Each player may put a land card from their " +
  "hand onto the battlefield, then each opponent who didn't draws a card.";

export default defineCard({
  name: "Kynaios and Tiro of Meletis",
  manaCost: "{R}{G}{W}{U}",
  colors: ["R", "G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 8,
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "each-player-may",
            who: "each-player",
            options: [{ putFromHand: { type: "land" }, text: "Put a land card from your hand onto the battlefield" }],
            ifDidnt: { kind: "draw", amount: 1, who: "that-player" },
            resultsFor: "each-opponent",
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
