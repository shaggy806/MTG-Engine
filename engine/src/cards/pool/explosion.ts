import { defineCard } from "../define.js";

const FACES = ["Expansion // Explosion", "Expansion", "Explosion"];
const EXPLOSION_TEXT = "Explosion deals X damage to any target. Target player draws X cards.";

// The right half of Expansion // Explosion (see expansion.ts).
export default defineCard({
  name: "Explosion",
  manaCost: "{X}{U}{U}{R}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: EXPLOSION_TEXT,
  targets: ["any-target", "player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: "x", target: 0 },
      { kind: "draw", amount: "x", target: 1 },
    ],
  },
  faces: FACES,
  split: true,
});
