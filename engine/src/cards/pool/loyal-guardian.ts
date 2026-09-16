import { defineCard } from "../define.js";

export default defineCard({
  name: "Loyal Guardian",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Rhino"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "Lieutenant — At the beginning of combat on your turn, if you control your commander, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: {
        kind: "controls",
        filter: { isCommander: true, controlledBy: "you" },
        atLeast: 1,
      },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Lieutenant — At the beginning of combat on your turn, if you control your commander, put a +1/+1 counter on each creature you control.",
    },
  ],
});
