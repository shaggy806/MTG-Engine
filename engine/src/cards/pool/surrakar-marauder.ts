import { defineCard } from "../define.js";

export default defineCard({
  name: "Surrakar Marauder",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Surrakar"],
  power: 2,
  toughness: 1,
  text: "Landfall — Whenever a land you control enters, this creature gains intimidate until end of turn. (It can't be blocked except by artifact creatures and/or creatures that share a color with it.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "intimidate",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gains intimidate until end of turn.",
    },
  ],
});
