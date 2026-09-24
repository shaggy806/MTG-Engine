import { defineCard } from "../define.js";

// Three stacked "as long as" anthems. Each count includes Jetmir itself
// (`countsSelf`), and a token stack counts as every token in it. The nine-
// creature double strike can switch on mid-combat — a creature entering or
// dying between the two combat-damage steps — which is rule 510.4's case:
// see `Game.recordFirstStepStrikers`.
const creatures = { type: "creature" } as const;

export default defineCard({
  name: "Jetmir, Nexus of Revels",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Demon"],
  power: 5,
  toughness: 4,
  text:
    "Creatures you control get +1/+0 and have vigilance as long as you control three or more creatures.\n" +
    "Creatures you control also get +1/+0 and have trample as long as you control six or more creatures.\n" +
    "Creatures you control also get +1/+0 and have double strike as long as you control nine or more creatures.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "controls", filter: creatures, atLeast: 3, countsSelf: true },
      grantPt: [1, 0],
      grantKeywords: ["vigilance"],
      text: "Creatures you control get +1/+0 and have vigilance as long as you control three or more creatures.",
    },
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "controls", filter: creatures, atLeast: 6, countsSelf: true },
      grantPt: [1, 0],
      grantKeywords: ["trample"],
      text: "Creatures you control also get +1/+0 and have trample as long as you control six or more creatures.",
    },
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "controls", filter: creatures, atLeast: 9, countsSelf: true },
      grantPt: [1, 0],
      grantKeywords: ["double-strike"],
      text: "Creatures you control also get +1/+0 and have double strike as long as you control nine or more creatures.",
    },
  ],
});
