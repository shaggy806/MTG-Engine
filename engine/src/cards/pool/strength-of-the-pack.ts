import { defineCard } from "../define.js";

export default defineCard({
  name: "Strength of the Pack",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Put two +1/+1 counters on each creature you control.",
  effect: {
    kind: "add-counter-all",
    filter: { type: "creature", controlledBy: "you" },
    counter: "+1/+1",
    amount: 2,
  },
});
