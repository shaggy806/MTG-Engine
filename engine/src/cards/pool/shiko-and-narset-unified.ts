import { defineCard } from "../define.js";

const FLURRY_TEXT =
  "Flurry — Whenever you cast your second spell each turn, copy that spell if it targets a permanent or player, and you may choose new targets for the copy. If you don't copy a spell this way, draw a card.";

// The rulings this follows: the copy is made even if the spell was countered
// in response (from the spell as it last was on the stack); a spell that
// targets a permanent or player must be copied, even with no legal target
// left for the copy, so it can't be turned down to draw instead; an Aura
// spell targets, and its copy becomes a token; the copy keeps the spell's
// modes, {X} and the additional costs paid for it.
export default defineCard({
  name: "Shiko and Narset, Unified",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Spirit", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${FLURRY_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "copy-spell",
        target: "trigger-spell",
        ifTargets: "permanent-or-player",
        newTargets: true,
        otherwise: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: FLURRY_TEXT,
    },
  ],
});
