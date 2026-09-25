import { defineCard } from "../define.js";

export default defineCard({
  name: "Dreadwurm",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wurm", "Horror"],
  power: 5,
  toughness: 4,
  text: "Landfall — Whenever a land you control enters, this creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gains indestructible until end of turn.",
    },
  ],
});
