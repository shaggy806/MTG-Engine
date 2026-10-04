import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 5220.
//
// Rulings:
//   [2022-12-02] The value of X is locked in as the first ability resolves. The bonus it grants
//     won't change after that point, even if the number of Rats you control does.
//   [2022-12-02] You choose which Rat creature cards to return to your hand as the last ability
//     resolves. You may choose Rat creature cards milled with this ability.

const PUMP_TEXT =
  "Whenever Ashcoat attacks or blocks, other Rats you control get +X/+X until end of turn, where X is the number of Rats you control.";
// X counts Ashcoat too, read once as it resolves (the ruling); the bonus
// spares Ashcoat itself ("other Rats").
const PUMP: EffectSpec = {
  kind: "modify-pt-all",
  filter: { subtype: "Rat", controlledBy: "you" },
  power: { countOf: { subtype: "Rat", controlledBy: "you" } },
  toughness: { countOf: { subtype: "Rat", controlledBy: "you" } },
  duration: "end-of-turn",
  exceptSource: true,
};

export default defineCard({
  name: "Ashcoat of the Shadow Swarm",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Warlock"],
  power: 3,
  toughness: 4,
  text: "Whenever Ashcoat attacks or blocks, other Rats you control get +X/+X until end of turn, where X is the number of Rats you control.\nAt the beginning of your end step, you may mill four cards. If you do, return up to two Rat creature cards from your graveyard to your hand. (To mill a card, put the top card of your library into your graveyard.)",
  triggered: [
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: PUMP, resolve: null, text: PUMP_TEXT },
    { trigger: { on: "blocks", who: "self" }, targets: [], effect: PUMP, resolve: null, text: PUMP_TEXT },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // A `may` is offered only when the mill can be done in full (rule
      // 701.17b, `mayBeDone`), so "if you do" is the mill happening. The Rats
      // are chosen as it resolves, milled ones included (the ruling).
      effect: {
        kind: "may",
        prompt: "Mill four cards, then return up to two Rat creature cards from your graveyard to your hand?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "mill", target: "you", amount: 4 },
            {
              kind: "look-and-choose",
              zone: "graveyard",
              min: 0,
              max: 2,
              destination: "hand",
              leftover: "stay",
              filter: { type: "creature", subtype: "Rat" },
            },
          ],
        },
      },
      resolve: null,
      text: "At the beginning of your end step, you may mill four cards. If you do, return up to two Rat creature cards from your graveyard to your hand.",
    },
  ],
});
