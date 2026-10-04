import { defineCard } from "../define.js";

// EDHREC rank 2501.
//
// X is the sacrificed creature's power as it last existed on the battlefield
// (rule 608.2h) — Greater Good's `{ powerOf: "sacrificed" }`.
const TEXT =
  "{B}, {T}, Sacrifice another creature: Create X 2/2 black Zombie creature tokens, where X is the sacrificed creature's power.";

export default defineCard({
  name: "Ghoulcaller Gisa",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 4,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{B}", tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: { powerOf: "sacrificed" } },
      resolve: null,
      text: TEXT,
      otherOnly: true,
    },
  ],
});
