import { defineCard } from "../define.js";

export default defineCard({
  name: "Thopter Architect",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 3,
  text: "Whenever an artifact you control enters, target creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever an artifact you control enters, target creature gains flying until end of turn.",
    },
  ],
});
