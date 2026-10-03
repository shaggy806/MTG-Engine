import { defineCard } from "../define.js";

// Top-commanders rank 454. "That much" is the damage the creature was
// actually dealt (after prevention); a spell with two targets, or one
// aimed at a player too, doesn't count unless every target is that one
// creature.
const DAMAGE_TEXT =
  "Whenever an instant or sorcery spell you control that targets only a single creature deals damage to " +
  "that creature, Imodane deals that much damage to each opponent.";

export default defineCard({
  name: "Imodane, the Pyrohammer",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 4,
  toughness: 4,
  text: DAMAGE_TEXT,
  triggered: [
    {
      trigger: {
        on: "deals-damage",
        who: "you-control",
        filter: {
          typesAnyOf: ["instant", "sorcery"],
          targets: { only: true, single: true, permanent: { type: "creature" } },
        },
        to: "creature",
        toItsTarget: true,
      },
      targets: [],
      effect: { kind: "damage", amount: { triggerValue: true }, who: "each-opponent" },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
