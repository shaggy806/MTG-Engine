import { defineCard } from "../define.js";

export default defineCard({
  name: "Pretending Poxbearers",
  manaCost: "{1}{W/B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Citizen", "Ally"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, create a 1/1 white Ally creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Ally Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Ally creature token.",
    },
  ],
});
