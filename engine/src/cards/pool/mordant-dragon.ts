import { defineCard } from "../define.js";

// "target creature **that player** controls" is exactly what
// `"creature-defending-player-controls"` means: the trigger fires while the
// Dragon is still an attacker, so its `attacking` field names the player it
// just damaged. In a two-player game that coincides with "a creature an
// opponent controls"; at a 3-4 player table it does not.
export default defineCard({
  name: "Mordant Dragon",
  manaCost: "{3}{R}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "{1}{R}: This creature gets +1/+0 until end of turn.\n" +
    "Whenever this creature deals combat damage to a player, you may have it " +
    "deal that much damage to target creature that player controls.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{R}: This creature gets +1/+0 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: ["creature-defending-player-controls"],
      effect: {
        kind: "may",
        prompt: "Deal that much damage to the targeted creature?",
        // "That much" — the combat damage just dealt, which the {1}{R} pump
        // can have raised above the printed 5.
        effect: { kind: "damage", amount: { triggerValue: true }, target: 0 },
      },
      resolve: null,
      text:
        "Whenever Mordant Dragon deals combat damage to a player, you may have it " +
        "deal that much damage to target creature that player controls.",
    },
  ],
});
