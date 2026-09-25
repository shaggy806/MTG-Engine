import { defineCard } from "../define.js";

export default defineCard({
  name: "Belligerent Whiptail",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 4,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, this creature gains first strike until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gains first strike until end of turn.",
    },
  ],
});
