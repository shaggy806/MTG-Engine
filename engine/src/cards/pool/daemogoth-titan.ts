import { defineCard } from "../define.js";

// EDHREC rank 5564.
// Any creature you control may be the one sacrificed, Daemogoth Titan included.
const TEXT = "Whenever this creature attacks or blocks, sacrifice a creature.";
const SACRIFICE = { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1 } as const;

export default defineCard({
  name: "Daemogoth Titan",
  manaCost: "{B/G}{B/G}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 11,
  toughness: 10,
  text: TEXT,
  triggered: [
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: SACRIFICE, resolve: null, text: TEXT },
    { trigger: { on: "blocks", who: "self" }, targets: [], effect: SACRIFICE, resolve: null, text: TEXT },
  ],
});
