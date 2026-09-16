import { defineCard } from "../define.js";

export default defineCard({
  name: "Condemn",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Put target attacking creature on the bottom of its owner's library. Its " +
    "controller gains life equal to its toughness.",
  targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
  effect: {
    kind: "sequence",
    effects: [
      // Life first: `toughnessOf` needs the creature still measurable.
      { kind: "gain-life", amount: { toughnessOf: 0 }, toControllerOfTarget: 0 },
      { kind: "put-on-bottom-of-library", target: 0 },
    ],
  },
});
