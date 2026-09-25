import { defineCard } from "../define.js";

export default defineCard({
  name: "Perimeter Patrol",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Whenever an artifact you control enters, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever an artifact you control enters, this creature gets +1/+0 until end of turn.",
    },
  ],
});
