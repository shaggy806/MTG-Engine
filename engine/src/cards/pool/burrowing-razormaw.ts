import { defineCard } from "../define.js";

export default defineCard({
  name: "Burrowing Razormaw",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 2,
  text: "When this creature dies, mill four cards. (Put the top four cards of your library into your graveyard.)",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 4 },
      resolve: null,
      text: "When this creature dies, mill four cards.",
    },
  ],
});
