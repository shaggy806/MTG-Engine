import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 2420.
//
// "Two other target legendary creatures" is one instance of the word
// "target" over two slots, so they must be two different creatures, and
// neither may be Ioreth itself.
const ONE_TEXT = "{T}: Untap another target permanent.";
const TWO_TEXT = "{T}: Untap two other target legendary creatures.";

export default defineCard({
  name: "Ioreth of the Healing House",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 4,
  text: `${ONE_TEXT}\n${TWO_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "other", of: "permanent" }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: ONE_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      targets: distinctTargets(2, {
        kind: "other",
        of: { kind: "permanent", filter: { type: "creature", supertype: "legendary" } },
      }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          { kind: "untap", target: 1 },
        ],
      },
      resolve: null,
      text: TWO_TEXT,
    },
  ],
});
