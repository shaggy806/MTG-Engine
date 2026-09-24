import { defineCard } from "../define.js";

// "For each target" counts distinct players and objects (the card's ruling:
// a spell aimed at one creature through two "target creature"s is one
// target), and the targets are chosen before the cost is locked in (rule
// 601.2c, then 601.2f) — so `legalActions` offers a spell under her with the
// range of target counts it's affordable at (`LegalAction.targetCount`).
// Only generic mana is ever taken off.
export default defineCard({
  name: "Hinata, Dawn-Crowned",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kirin", "Spirit"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "trample"],
  text:
    "Flying, trample\n" +
    "Spells you cast cost {1} less to cast for each target.\n" +
    "Spells your opponents cast cost {1} more to cast for each target.",
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: {}, caster: "you", perTarget: true, reduceGeneric: 1 },
      text: "Spells you cast cost {1} less to cast for each target.",
    },
    {
      affects: { scope: "self" },
      costModification: { applies: {}, caster: "opponent", perTarget: true, increaseGeneric: 1 },
      text: "Spells your opponents cast cost {1} more to cast for each target.",
    },
  ],
});
