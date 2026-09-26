import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Old-Growth
 * Grove, is a land you play instead. */
export default defineCard({
  name: "Revitalizing Repast",
  manaCost: "{B/G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "Put a +1/+1 counter on target creature. It gains indestructible until end of turn.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
  faces: ["Revitalizing Repast", "Old-Growth Grove"],
});
