import { defineCard } from "../define.js";

// EDHREC rank 3693.
//
// Rulings:
//   [2024-01-12] If Pack Rat leaves the battlefield before its activated ability resolves, the
//     token will still enter the battlefield as a copy of Pack Rat, using Pack Rat's copiable
//     values from when it was last on the battlefield.
//   [2024-01-12] The token won't copy counters on Pack Rat, nor will it copy other effects that
//     have changed Pack Rat's power, toughness, types, color, or so on.
//   [2024-01-12] The token will copy Pack Rat's two abilities. Its power and toughness will be
//     equal to the number of Rats you control (not the number of Rats you controlled when the
//     token entered the battlefield). It will also be able to create copies of itself.
//   [2024-01-12] Pack Rat's first ability counts any creature you control with the creature type
//     Rat, not just Pack Rats. That ability works in all zones, not only the battlefield.
//
// A characteristic-defining count (Ashaya's `setBasePtFromCount`, which works
// in every zone); the copy is Homunculus Horde's `create-token-copy` of the
// source, read as it last existed if it has left.
const PT_TEXT = "Pack Rat's power and toughness are each equal to the number of Rats you control.";
const COPY_TEXT = "{2}{B}, Discard a card: Create a token that's a copy of this creature.";

export default defineCard({
  name: "Pack Rat",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat"],
  power: 0,
  toughness: 0,
  text: `${PT_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "creature", subtype: "Rat", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1 },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
