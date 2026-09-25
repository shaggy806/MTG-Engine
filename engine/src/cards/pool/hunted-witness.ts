import { defineCard } from "../define.js";

export default defineCard({
  name: "Hunted Witness",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, create a 1/1 white Soldier creature token with lifelink.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Soldier Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Soldier creature token with lifelink.",
    },
  ],
});
