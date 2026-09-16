import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragonmaster Outcast",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 1,
  text:
    "At the beginning of your upkeep, if you control six or more lands, create a " +
    "5/5 red Dragon creature token with flying.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 6 },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 1 },
      resolve: null,
      text:
        "At the beginning of your upkeep, if you control six or more lands, create a " +
        "5/5 red Dragon creature token with flying.",
    },
  ],
});
