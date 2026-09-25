import { defineCard } from "../define.js";

export default defineCard({
  name: "Fire Nation Sentinels",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 4,
  toughness: 4,
  text: "Whenever a nontoken creature an opponent controls dies, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "any",
        filter: { token: false, type: "creature", controlledBy: "opponent" },
      },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Whenever a nontoken creature an opponent controls dies, put a +1/+1 counter on each creature you control.",
    },
  ],
});
