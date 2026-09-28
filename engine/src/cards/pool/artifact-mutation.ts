import { defineCard } from "../define.js";

// "That artifact's mana value" is read as it last existed (rule 608.2h),
// after the destroy.
export default defineCard({
  name: "Artifact Mutation",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  types: ["instant"],
  text:
    "Destroy target artifact. It can't be regenerated. Create X 1/1 green Saproling creature tokens, " +
    "where X is that artifact's mana value.",
  targets: ["artifact"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0, cantBeRegenerated: true },
      { kind: "create-token", token: "Saproling Token", count: { manaValueOf: 0 } },
    ],
  },
});
