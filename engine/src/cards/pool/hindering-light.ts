import { defineCard } from "../define.js";

// EDHREC rank 5519.
//
// Rulings:
//   [2008-10-01] Hindering Light can target a spell that has multiple targets, as long as at least
//     one of those targets is you or a permanent you control.
//   [2008-10-01] You may choose to target a spell that "can't be countered." If you do, the first
//     part of Hindering Light's effect won't do anything, but you'll still get to draw a card.
//
// Dawn Charm's "spell that targets you" or Rebuff the Wicked's "spell that
// targets a permanent you control", joined with `anyOf`: one such target is
// enough, whatever else the spell targets.
export default defineCard({
  name: "Hindering Light",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["instant"],
  text: "Counter target spell that targets you or a permanent you control.\nDraw a card.",
  targets: [
    {
      kind: "spell",
      filter: {
        anyOf: [{ targets: { player: "you" } }, { targets: { permanent: { controlledBy: "you" } } }],
      },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "draw", amount: 1 },
    ],
  },
});
