import { defineCard } from "../define.js";

// EDHREC rank 3131.
//
// Rulings:
//   [2019-10-04] No player may take actions between the time you announce you're activating
//     Witch's Oven's ability and the time you sacrifice a creature.
//
// The sacrificed creature's toughness is read as it last existed on the battlefield (the
// `sacrificed` condition matches its last-known characteristics).

const TEXT =
  "{T}, Sacrifice a creature: Create a Food token. If the sacrificed creature's toughness was 4 or greater, create two Food tokens instead. (They're artifacts with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")";

export default defineCard({
  name: "Witch's Oven",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "sacrificed", filter: { toughness: { op: "gte", n: 4 } } },
        then: { kind: "create-token", token: "Food Token", count: 2 },
        else: { kind: "create-token", token: "Food Token", count: 1 },
      },
      resolve: null,
      text: "{T}, Sacrifice a creature: Create a Food token. If the sacrificed creature's toughness was 4 or greater, create two Food tokens instead.",
    },
  ],
});
