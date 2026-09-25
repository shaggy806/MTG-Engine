import { defineCard } from "../define.js";

export default defineCard({
  name: "Snapping Creeper",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 2,
  toughness: 3,
  text: "Landfall — Whenever a land you control enters, this creature gains vigilance until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "vigilance",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gains vigilance until end of turn.",
    },
  ],
});
