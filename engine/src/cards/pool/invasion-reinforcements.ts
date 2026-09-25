import { defineCard } from "../define.js";

export default defineCard({
  name: "Invasion Reinforcements",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 1,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, create a 1/1 white Ally creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Ally Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Ally creature token.",
    },
  ],
});
