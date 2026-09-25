import type { EffectAmount } from "../../effects.js";
import { defineCard } from "../define.js";

// #5 in top-commanders.txt.
//
// X is counted as the `may` applies (a player can't be dealt combat damage
// between the payment and the draw), and the payment is offered only when X
// life can be paid — with X = 0 it's a free "pay 0, draw 0".
const X: EffectAmount = { playersWithTurnStat: "combat-damage-taken", who: "each-opponent" };
const TRIGGER_TEXT =
  "At the beginning of each of your postcombat main phases, you may pay X life, where X is the " +
  "number of opponents that were dealt combat damage this turn. If you do, draw X cards.";

export default defineCard({
  name: "Tymna the Weaver",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  pairing: { kind: "partner" },
  text: `Lifelink\n${TRIGGER_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay X life (X = opponents dealt combat damage this turn) to draw X cards?",
        costLife: X,
        effect: { kind: "draw", amount: X },
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
