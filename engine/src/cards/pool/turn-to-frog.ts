import { defineCard } from "../define.js";

export default defineCard({
  name: "Turn to Frog",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Until end of turn, target creature loses all abilities and becomes a 0/1 blue Frog.",
  targets: ["creature"],
  effect: {
    kind: "animate",
    target: 0,
    power: 0,
    toughness: 1,
    addTypes: ["creature"],
    addSubtypes: [],
    setSubtypes: ["Frog"],
    setColors: ["U"],
    loseAbilities: true,
    duration: "end-of-turn",
  },
});
