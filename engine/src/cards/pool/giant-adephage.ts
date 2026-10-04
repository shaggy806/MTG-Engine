import { defineCard } from "../define.js";

// EDHREC rank 2527. Homunculus Horde's `create-token-copy` of the source:
// its copiable values only, none of its counters or other changes.
//
// Rulings:
//   [2013-01-24] As the token is created, it checks the printed values of the Giant Adephage it's
//     copying—or, if the Giant Adephage whose ability triggered was itself a token, the original
//     characteristics of that token as stated by the effect that put it onto the battlefield—as
//     well as any copy effects that have been applied to it. It won't copy counters on the Giant
//     Adephage, nor will it copy other effects that have changed Giant Adephage's power,
//     toughness, types, color, or so on.

const TEXT = "Whenever this creature deals combat damage to a player, create a token that's a copy of this creature.";

export default defineCard({
  name: "Giant Adephage",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 7,
  toughness: 7,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
