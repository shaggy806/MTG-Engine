import { defineCard } from "../define.js";

export default defineCard({
  name: "Pavel Maliki",
  manaCost: "{4}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 5,
  toughness: 3,
  text: "{B}{R}: Pavel Maliki gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B}{R}: Pavel Maliki gets +1/+0 until end of turn.",
    },
  ],
});
