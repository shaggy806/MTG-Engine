import { defineCard } from "../define.js";

export default defineCard({
  name: "Teyo's Lightshield",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 0,
  toughness: 3,
  text: "When this creature enters, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "When this creature enters, put a +1/+1 counter on target creature you control.",
    },
  ],
});
