import { defineCard } from "../define.js";

// EDHREC rank 4880.
//
// Rulings:
//   [2013-01-24] Biomass Mutation overwrites any effects that set the power and/or toughness of a
//     creature you control to a specific value. Effects that modify power and/or toughness but
//     don't set them to a specific value (like the one created by Giant Growth), power/toughness
//     changes from counters, and effects that switch a creature's power and toughness will
//     continue to apply.
//   [2013-01-24] Choosing 0 as the value for X will likely cause creatures you control to become
//     0/0 and be put into the graveyard.
//
// Mirror Entity's `animate-all` (a layer-7b base P/T set, so counters and
// pumps still apply on top), with the spell's own X.

const TEXT = "Creatures you control have base power and toughness X/X until end of turn.";

export default defineCard({
  name: "Biomass Mutation",
  manaCost: "{X}{G/U}{G/U}",
  colors: ["U", "G"],
  types: ["instant"],
  text: TEXT,
  effect: {
    kind: "animate-all",
    filter: { type: "creature", controlledBy: "you" },
    power: "x",
    toughness: "x",
    duration: "end-of-turn",
  },
});
