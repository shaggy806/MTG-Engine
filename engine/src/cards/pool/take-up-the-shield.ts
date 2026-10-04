import { defineCard } from "../define.js";

// EDHREC rank 3510.

export default defineCard({
  name: "Take Up the Shield",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Put a +1/+1 counter on target creature. It gains lifelink and indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
