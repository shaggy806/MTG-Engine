import { defineCard } from "../define.js";

// EDHREC rank 3710. Giant Adephage's create-token-copy of the source, on an
// enrage trigger (once per damage batch). A Polyraptor that died of the
// damage is copied as it last existed (the ruling).
//
// Rulings:
//   [2018-01-19] If multiple sources deal damage to a creature with an enrage ability at the same
//     time, most likely because multiple creatures blocked that creature, the enrage ability
//     triggers only once.
//   [2018-01-19] If Polyraptor leaves the battlefield before its triggered ability resolves, most
//     likely because it was dealt lethal damage, the token will still enter the battlefield as a
//     copy of Polyraptor, using Polyraptor's copiable values from when it was last on the
//     battlefield.
//   [2018-01-19] The token won't copy counters or damage marked on Polyraptor, nor will it copy
//     other effects that have changed Polyraptor's power, toughness, types, color, or so on.
//   [2018-01-19] The token will have Polyraptor's ability. It will also be able to create copies
//     of itself.

const TEXT = "Enrage — Whenever this creature is dealt damage, create a token that's a copy of this creature.";

export default defineCard({
  name: "Polyraptor",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 5,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
