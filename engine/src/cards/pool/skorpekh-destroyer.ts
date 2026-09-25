import { defineCard } from "../define.js";

export default defineCard({
  name: "Skorpekh Destroyer",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Necron"],
  power: 4,
  toughness: 2,
  keywords: ["deathtouch"],
  text: "Deathtouch\nHyperphase Threshers — Whenever an artifact you control enters, this creature gains first strike until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Hyperphase Threshers — Whenever an artifact you control enters, this creature gains first strike until end of turn.",
    },
  ],
});
