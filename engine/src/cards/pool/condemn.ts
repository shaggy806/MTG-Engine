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
      { kind: "put-on-bottom-of-library", target: 0 },
      // The printed order: `toughnessOf` and "its controller" read the
      // creature as it last existed on the battlefield (rule 608.2h).
      { kind: "gain-life", amount: { toughnessOf: 0 }, toControllerOfTarget: 0 },
    ],
  },
});
