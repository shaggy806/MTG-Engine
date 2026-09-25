import { defineCard } from "../define.js";

export default defineCard({
  name: "Yotian Dissident",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 1,
  text: "Whenever an artifact you control enters, put a +1/+1 counter on target creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, put a +1/+1 counter on target creature you control.",
    },
  ],
});
