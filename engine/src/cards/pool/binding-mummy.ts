import { defineCard } from "../define.js";

export default defineCard({
  name: "Binding Mummy",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "Whenever another Zombie you control enters, you may tap target artifact or creature.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Zombie" },
        otherOnly: true,
      },
      targets: ["artifact-or-creature"],
      effect: {
        kind: "may",
        prompt: "Tap target artifact or creature?",
        effect: { kind: "tap", target: 0 },
      },
      resolve: null,
      text: "Whenever another Zombie you control enters, you may tap target artifact or creature.",
    },
  ],
});
