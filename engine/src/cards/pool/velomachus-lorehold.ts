import { defineCard } from "../define.js";

// The seven are looked at, not revealed: only Velomachus's controller sees
// them. The spell is cast from among them as the trigger resolves (rule
// 608.2g), its mana value capped by Velomachus's power then — as it last was
// on the battlefield, if it has left. Every card not cast goes to the bottom.
const TEXT =
  "Whenever Velomachus Lorehold attacks, look at the top seven cards of your library. You may cast an instant or sorcery spell with mana value less than or equal to Velomachus Lorehold's power from among them without paying its mana cost. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Velomachus Lorehold",
  manaCost: "{5}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "vigilance", "haste"],
  text: `Flying, vigilance, haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "cast-now",
        from: { libraryTop: 7 },
        free: true,
        spell: {
          typesAnyOf: ["instant", "sorcery"],
          manaValue: { op: "lte", n: { amount: { powerOf: "source" } } },
        },
        rest: "bottom-random",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
