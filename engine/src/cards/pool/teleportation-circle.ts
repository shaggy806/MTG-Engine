import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your end step, exile up to one target artifact or creature you control, then return that card to the battlefield under its owner's control.";

export default defineCard({
  name: "Teleportation Circle",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        {
          kind: "optional",
          of: { kind: "permanent", whose: "you", filter: { typesAnyOf: ["artifact", "creature"] } },
        },
      ],
      effect: { kind: "flicker", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
