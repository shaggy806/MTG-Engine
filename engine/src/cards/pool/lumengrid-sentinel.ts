import { defineCard } from "../define.js";

export default defineCard({
  name: "Lumengrid Sentinel",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever an artifact you control enters, you may tap target permanent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: ["permanent"],
      effect: { kind: "may", prompt: "Tap target permanent?", effect: { kind: "tap", target: 0 } },
      resolve: null,
      text: "Whenever an artifact you control enters, you may tap target permanent.",
    },
  ],
});
