import { defineCard } from "../define.js";

export default defineCard({
  name: "Turn to Frog",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Until end of turn, target creature loses all abilities and becomes a blue Frog " +
    "with base power and toughness 1/1.",
  targets: ["creature"],
  effect: {
    kind: "animate",
    target: 0,
    power: 1,
    toughness: 1,
    addTypes: ["creature"],
    addSubtypes: [],
    setSubtypes: ["Frog"],
    setColors: ["U"],
    loseAbilities: true,
    duration: "end-of-turn",
  },
});
