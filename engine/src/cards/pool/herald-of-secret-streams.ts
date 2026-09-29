import { defineCard } from "../define.js";

const TEXT = "Creatures you control with +1/+1 counters on them can't be blocked.";

// Read as blockers are declared: a counter put on a creature already
// blocked doesn't unblock it (the ruling).
export default defineCard({
  name: "Herald of Secret Streams",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Warrior"],
  power: 2,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: { scope: "creatures-you-control", withCounter: { kind: "+1/+1" } },
      grantKeywords: ["unblockable"],
      text: TEXT,
    },
  ],
});
