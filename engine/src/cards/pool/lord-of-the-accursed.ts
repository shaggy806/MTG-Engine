import { defineCard } from "../define.js";

export default defineCard({
  name: "Lord of the Accursed",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 3,
  text:
    "Other Zombies you control get +1/+1.\n" +
    "{1}{B}, {T}: All Zombies gain menace until end of turn.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other Zombies you control get +1/+1.",
    },
  ],
  activated: [
    {
      // "**All** Zombies" — everyone's, which is why this isn't scoped to you.
      cost: { mana: "{1}{B}", tap: true },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { subtype: "Zombie" },
        keyword: "menace",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{B}, {T}: All Zombies gain menace until end of turn.",
    },
  ],
});
