import { defineCard } from "../define.js";

const SPELL_TEXT =
  "Magma Opus deals 4 damage divided as you choose among any number of targets. Tap two target permanents. Create a 4/4 blue and red Elemental creature token. Draw two cards.";
const TREASURE_TEXT = "{U/R}{U/R}, Discard this card: Create a Treasure token.";

// Targets: the two permanents to tap (two different ones — the ruling), then
// up to four targets for the damage, which may include those two. The 4 is
// divided as it's cast, at least 1 to each (rule 601.2d); a target gone
// illegal loses its share. If every target is illegal, nothing happens.
export default defineCard({
  name: "Magma Opus",
  manaCost: "{6}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: `${SPELL_TEXT}\n${TREASURE_TEXT}`,
  targets: [
    "permanent",
    { kind: "other", of: "permanent", than: { slot: 0 } },
    { kind: "any-number", of: "any-target", max: 4 },
  ],
  divided: { total: 4, slot: 2 },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage-divided", from: 2 },
      { kind: "tap", target: 0 },
      { kind: "tap", target: 1 },
      { kind: "create-token", token: "4/4 Blue Red Elemental Token", count: 1 },
      { kind: "draw", amount: 2 },
    ],
  },
  activated: [
    {
      cost: { mana: "{U/R}{U/R}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
      zone: "hand",
    },
  ],
});
