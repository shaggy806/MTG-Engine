import { defineCard } from "../define.js";

export default defineCard({
  name: "Altar of the Brood",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "Whenever another permanent you control enters, each opponent mills a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: {}, otherOnly: true },
      targets: [],
      effect: { kind: "mill", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "Whenever another permanent you control enters, each opponent mills a card.",
    },
  ],
});
