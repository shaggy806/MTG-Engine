import { defineCard } from "../define.js";

// Top-commanders rank 423. Two printed clauses, both existing vocabulary:
// the keyword, and one `attacks` trigger narrowed by a `CardFilter`.
//
// - "a creature you control": `who: "you-control"`, which includes Ognis
//   itself — the card says "a creature", not "another creature", and Ognis
//   has haste, so its own attack makes a Treasure.
// - "with haste": a `keyword` clause, which is one of the four `matchesFilter`
//   answers off the full layer fold rather than the printed card. That is the
//   point of the card — a creature that has haste only because something else
//   granted it (Ognis's own deck is built on exactly that) counts, and a
//   creature that has been around since last turn does not.
// - "create a tapped Treasure token": `create-token`'s `tapped` flag
//   (Overseer of the Damned's shape). A tapped batch is never folded into a
//   token stack, and Treasure Token has an activated ability so it would never
//   be stacked anyway.
const TRIGGER_TEXT =
  "Whenever a creature you control with haste attacks, create a tapped Treasure token.";

export default defineCard({
  name: "Ognis, the Dragon's Lash",
  manaCost: "{1}{B/R}{R}{R/G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Lizard", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\n" + TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { keyword: "haste" } },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
