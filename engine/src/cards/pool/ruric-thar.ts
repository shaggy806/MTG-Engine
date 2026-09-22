import { defineCard } from "../define.js";

/**
 * Top-commanders rank 437.
 *
 * "Whenever **a** player casts a noncreature spell" is `who: "any"` — the
 * ruling is explicit that it includes its own controller, so this is a
 * symmetrical tax rather than an opponents-only punisher. "That player" is the
 * one who cast it: a `cast-spell` trigger's trigger object is the spell, and
 * the `"trigger-controller"` player scope reads its controller. Not a target,
 * so a hexproof player still takes the 6, and the ability still resolves if the
 * spell that fired it is countered first (the trigger is above it on the stack).
 *
 * "Attacks each combat if able" is the `"must-attack"` restriction, the same
 * one Juggernaut carries.
 */
export default defineCard({
  name: "Ruric Thar, the Unbowed",
  manaCost: "{4}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ogre", "Warrior"],
  power: 6,
  toughness: 6,
  keywords: ["reach", "vigilance"],
  text:
    "Reach, vigilance\n" +
    "Ruric Thar attacks each combat if able.\n" +
    "Whenever a player casts a noncreature spell, Ruric Thar deals 6 damage to that player.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "Ruric Thar attacks each combat if able.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 6, who: "trigger-controller" },
      resolve: null,
      text: "Whenever a player casts a noncreature spell, Ruric Thar deals 6 damage to that player.",
    },
  ],
});
