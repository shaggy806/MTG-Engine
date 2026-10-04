import { defineCard } from "../define.js";

// EDHREC rank 4654.
//
// Rulings:
//   [2011-01-01] Lethal damage and effects that say "destroy" won't cause Darksteel Juggernaut to
//     be put into the graveyard. However, it can be put into the graveyard for a number of other
//     reasons. The most likely reasons are if its toughness is 0 or less or it's sacrificed.
//   [2011-01-01] The first ability works in all zones.
//   [2011-01-01] Since Darksteel Juggernaut is itself an artifact, its power and toughness will
//     always be at least 1 while it's on the battlefield (unless a spell or ability somehow
//     changes its card type).
//   [2011-01-01] If, during your declare attackers step, Darksteel Juggernaut is tapped, is
//     affected by a spell or ability that says it can't attack, or is affected by "summoning
//     sickness," then it doesn't attack. If there's a cost associated with having Darksteel
//     Juggernaut attack, you aren't forced to pay that cost, so it doesn't have to attack in that
//     case either.
//
// The CDA is Master of Etherium's (it works in every zone, and counts itself).

const CDA_TEXT =
  "Darksteel Juggernaut's power and toughness are each equal to the number of artifacts you control.";

export default defineCard({
  name: "Darksteel Juggernaut",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Juggernaut"],
  power: 0,
  toughness: 0,
  keywords: ["indestructible"],
  text: `Indestructible\n${CDA_TEXT}\nThis creature attacks each combat if able.`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: { countOf: { type: "artifact", controlledBy: "you" } }, plusPower: 0, plusToughness: 0 },
      text: CDA_TEXT,
    },
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
