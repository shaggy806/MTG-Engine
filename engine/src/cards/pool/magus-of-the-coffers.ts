import { defineCard } from "../define.js";

// EDHREC rank 5522.
//
// Cabal Coffers on a body: a "converter" (purely generic activation cost), so
// the auto-payer may fund it. "Each Swamp you control" is any permanent with
// the Swamp land type. Its {T} ability is subject to summoning sickness.

export default defineCard({
  name: "Magus of the Coffers",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 4,
  toughness: 4,
  text: "{2}, {T}: Add {B} for each Swamp you control.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "B",
        amount: { countOf: { subtype: "Swamp", controlledBy: "you" } },
      },
      resolve: null,
      text: "{2}, {T}: Add {B} for each Swamp you control.",
    },
  ],
});
