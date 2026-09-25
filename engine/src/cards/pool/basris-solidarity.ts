import { defineCard } from "../define.js";

export default defineCard({
  name: "Basri's Solidarity",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Put a +1/+1 counter on each creature you control.",
  effect: {
    kind: "add-counter-all",
    filter: { type: "creature", controlledBy: "you" },
    counter: "+1/+1",
    amount: 1,
  },
});
