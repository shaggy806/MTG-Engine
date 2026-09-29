import { defineCard } from "../define.js";

const DOUBLE_TEXT =
  "If a source you control would deal damage to an opponent or a permanent an opponent controls, it deals double that damage instead.";

// The damage is still dealt by its own source (the ruling). Divided or
// assigned damage is split first and doubled after, as `dealDamage` applies
// replacements to each packet.
export default defineCard({
  name: "Twinflame Tyrant",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${DOUBLE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        multiplier: 2,
        source: { controlledBy: "you" },
        to: "opponent-side",
      },
      text: DOUBLE_TEXT,
    },
  ],
});
