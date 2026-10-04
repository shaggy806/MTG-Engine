import { defineCard } from "../define.js";

// EDHREC rank 2742.
//
// Rulings:
//   [2024-11-08] Fog Bank's prevention effect isn't considered while assigning combat damage from
//     a creature with trample. For example, if it blocks a 5/5 creature with trample, that
//     creature's controller must assign 2 of that creature's combat damage to Fog Bank and the
//     remainder can be assigned to the defending player, planeswalker, or battle.
//
// Two prevention shields of the combat-only `would-deal-damage` kind: one on
// combat damage dealt to it (`to: "self"`), one on combat damage it deals
// (`fromSelf`). Trample assignment reads toughness, not prevention (the ruling).

const PREVENT_TEXT = "Prevent all combat damage that would be dealt to and dealt by this creature.";

export default defineCard({
  name: "Fog Bank",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 2,
  keywords: ["defender", "flying"],
  text: `Defender (This creature can't attack.)\nFlying\n${PREVENT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", combat: true, prevent: true, to: "self" },
      text: PREVENT_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", combat: true, prevent: true, fromSelf: true },
      text: PREVENT_TEXT,
    },
  ],
});
