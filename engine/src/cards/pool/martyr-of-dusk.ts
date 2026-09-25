import { defineCard } from "../define.js";

export default defineCard({
  name: "Martyr of Dusk",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, create a 1/1 white Vampire creature token with lifelink.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Vampire creature token with lifelink.",
    },
  ],
});
