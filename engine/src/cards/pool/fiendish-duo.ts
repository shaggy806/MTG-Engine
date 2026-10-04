import { defineCard } from "../define.js";

// EDHREC rank 3554.

const DOUBLE_TEXT = "If a source would deal damage to an opponent, it deals double that damage to that player instead.";

export default defineCard({
  name: "Fiendish Duo",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 5,
  toughness: 5,
  keywords: ["first-strike"],
  text: `First strike (This creature deals combat damage before creatures without first strike.)\n${DOUBLE_TEXT}`,
  static: [
    {
      // Any source, yours or not; only damage to an opponent (a player) of
      // this permanent's controller — never a permanent.
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", multiplier: 2, to: "opponent" },
      text: DOUBLE_TEXT,
    },
  ],
});
