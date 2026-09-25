import { defineCard } from "../define.js";

export default defineCard({
  name: "Unleash Fury",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Double the power of target creature until end of turn.",
  targets: ["creature"],
  // "Double" is "+X/+0 where X is its current power" — read at resolution.
  effect: {
    kind: "modify-pt",
    target: 0,
    power: { powerOf: 0, doubling: true },
    toughness: 0,
    duration: "end-of-turn",
  },
});
