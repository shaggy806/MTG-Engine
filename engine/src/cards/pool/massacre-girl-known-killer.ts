import { defineCard } from "../define.js";

// The toughness is the creature's as it last existed on the battlefield (the
// ruling), which the dies trigger's filter reads — fixed once it has died, so
// the intervening "if" asks the same question again as it resolves. Wither
// covers any damage creatures you control deal to creatures, combat or not.
const DRAW_TEXT = "Whenever a creature an opponent controls dies, if its toughness was less than 1, draw a card.";

export default defineCard({
  name: "Massacre Girl, Known Killer",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 4,
  toughness: 4,
  keywords: ["menace"],
  text: `Menace\nCreatures you control have wither. (They deal damage to creatures in the form of -1/-1 counters.)\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["wither"],
      text: "Creatures you control have wither.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "opponent",
        filter: { type: "creature", toughness: { op: "lt", n: 1 } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
