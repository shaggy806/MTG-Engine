import { defineCard } from "../define.js";

export default defineCard({
  name: "Foundation Breaker",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
  evoke: { cost: "{1}{G}" },
  text:
    "When this creature enters, you may destroy target artifact or enchantment.\n" +
    "Evoke {1}{G} (You may cast this spell for its evoke cost. If you do, it's sacrificed when it enters.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["artifact-or-enchantment"],
      effect: {
        kind: "may",
        prompt: "Destroy target artifact or enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may destroy target artifact or enchantment.",
    },
  ],
});
