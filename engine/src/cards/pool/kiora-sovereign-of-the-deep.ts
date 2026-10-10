import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 8761 (top-500 commander). Sunbird's Invocation's shape, looked
// at rather than revealed, and "less than X".
const CAST =
  "Whenever you cast a Kraken, Leviathan, Octopus, or Serpent spell from your hand, look at the top X cards of your library, where X is that spell's mana value. You may cast a spell with mana value less than X from among them without paying its mana cost. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Kiora, Sovereign of the Deep",
  manaCost: "{3}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Noble"],
  power: 4,
  toughness: 5,
  keywords: ["vigilance"],
  text: `Vigilance, ward {3}\n${CAST}`,
  triggered: [
    ward({ mana: "{3}" }),
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        from: "hand",
        filter: {
          anyOf: [{ subtype: "Kraken" }, { subtype: "Leviathan" }, { subtype: "Octopus" }, { subtype: "Serpent" }],
        },
      },
      targets: [],
      effect: {
        kind: "cast-now",
        from: { libraryTop: { manaValueOf: "trigger-object" } },
        free: true,
        spell: { manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } } },
        rest: "bottom-random",
      },
      resolve: null,
      text: CAST,
    },
  ],
});
