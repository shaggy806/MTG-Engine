import { defineCard } from "../define.js";

export default defineCard({
  name: "Amulet of Vigor",
  manaCost: "{1}",
  types: ["artifact"],
  text: "Whenever a permanent you control enters tapped, untap it.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { tapped: true } },
      targets: [],
      effect: { kind: "untap", target: "trigger-object" },
      resolve: null,
      text: "Whenever a permanent you control enters tapped, untap it.",
    },
  ],
});
