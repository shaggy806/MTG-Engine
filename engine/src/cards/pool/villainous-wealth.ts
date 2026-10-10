import { defineCard } from "../define.js";

// EDHREC rank 2437. Gix's shape with the spells' mana value capped at X.
const TEXT =
  "Target opponent exiles the top X cards of their library. You may cast any number of spells with mana value X or less from among them without paying their mana costs.";

export default defineCard({
  name: "Villainous Wealth",
  manaCost: "{X}{B}{G}{U}",
  colors: ["B", "G", "U"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["opponent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile-from-library", whose: 0, amount: "x" },
      {
        kind: "cast-now",
        from: "exiled-this-way",
        free: true,
        repeat: true,
        spell: { manaValue: { op: "lte", n: { amount: "x" } } },
      },
    ],
  },
});
