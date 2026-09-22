import { defineCard } from "../define.js";

// Top-commanders rank 495. Only triggers about the damage itself: a lifelink
// creature's life gain triggers Ajani's Pridemate once, not twice (the 2024
// ruling), because that trigger is caused by gaining life, not by the damage.
export default defineCard({
  name: "Felix Five-Boots",
  manaCost: "{2}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ooze", "Rogue"],
  power: 5,
  toughness: 4,
  keywords: ["menace"],
  text:
    "Menace, ward {2}\n" +
    "If a creature you control dealing combat damage to a player causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
  static: [
    {
      affects: { scope: "self" },
      ward: { mana: "{2}" },
      text: "Ward {2}",
    },
    {
      affects: { scope: "self" },
      doubleTriggers: {
        cause: "combat-damage-to-player",
        filter: { type: "creature", controlledBy: "you" },
      },
      text:
        "If a creature you control dealing combat damage to a player causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.",
    },
  ],
});
