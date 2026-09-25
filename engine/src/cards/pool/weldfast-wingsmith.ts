import { defineCard } from "../define.js";

export default defineCard({
  name: "Weldfast Wingsmith",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 3,
  toughness: 3,
  text: "Whenever an artifact you control enters, this creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever an artifact you control enters, this creature gains flying until end of turn.",
    },
  ],
});
