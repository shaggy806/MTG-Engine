import { defineCard } from "../define.js";

// EDHREC rank 4715.
//
// A permanent spell's kicker rider is an ETB trigger with a `self-kicked`
// intervening-if (Josu Vess's shape). The bounce reads creature types through
// `hasSubtype`, so a changeling counts as each of the excepted types.

const BOUNCE_TEXT =
  "When Slinn Voda enters, if it was kicked, return all creatures to their owners' hands except for Merfolk, Krakens, Leviathans, Octopuses, and Serpents.";

export default defineCard({
  name: "Slinn Voda, the Rising Deep",
  manaCost: "{6}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Leviathan"],
  power: 8,
  toughness: 8,
  text: `Kicker {1}{U} (You may pay an additional {1}{U} as you cast this spell.)\n${BOUNCE_TEXT}`,
  kicker: { cost: "{1}{U}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [],
      effect: {
        kind: "return-to-hand-all",
        filter: {
          type: "creature",
          notSubtypes: ["Merfolk", "Kraken", "Leviathan", "Octopus", "Serpent"],
        },
      },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
});
