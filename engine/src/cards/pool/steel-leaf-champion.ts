import { defineCard } from "../define.js";

const EVASION_TEXT = "This creature can't be blocked by creatures with power 2 or less.";

// Checked as blockers are declared: a blocker shrunk afterwards doesn't make
// it unblocked (the ruling).
export default defineCard({
  name: "Steel Leaf Champion",
  manaCost: "{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Knight"],
  power: 5,
  toughness: 4,
  text: EVASION_TEXT,
  static: [
    {
      affects: { scope: "self" },
      cantBeBlockedBy: { power: { op: "lte", n: 2 } },
      text: EVASION_TEXT,
    },
  ],
});
