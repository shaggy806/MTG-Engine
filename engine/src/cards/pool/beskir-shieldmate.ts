import { defineCard } from "../define.js";

export default defineCard({
  name: "Beskir Shieldmate",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, create a 1/1 white Human Warrior creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Warrior Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Human Warrior creature token.",
    },
  ],
});
