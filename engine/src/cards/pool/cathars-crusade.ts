import { defineCard } from "../define.js";

export default defineCard({
  name: "Cathars' Crusade",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Whenever a creature you control enters, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Whenever a creature you control enters, put a +1/+1 counter on each creature you control.",
    },
  ],
});
