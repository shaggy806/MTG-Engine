import { defineCard } from "../define.js";

// Its own cascade is printed; "Sliver spells you cast have cascade" only
// works while it's on the battlefield, so a Sliver its own cascade casts
// doesn't cascade (the ruling).
const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;

export default defineCard({
  name: "The First Sliver",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 7,
  toughness: 7,
  text:
    "Cascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card " +
    "that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random " +
    "order.)\nSliver spells you cast have cascade.",
  triggered: [CASCADE],
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { subtype: "Sliver" }, triggered: [CASCADE] },
      text: "Sliver spells you cast have cascade.",
    },
  ],
});
