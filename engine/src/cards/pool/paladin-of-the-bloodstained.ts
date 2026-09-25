import { defineCard } from "../define.js";

export default defineCard({
  name: "Paladin of the Bloodstained",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, create a 1/1 white Vampire creature token with lifelink.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Vampire creature token with lifelink.",
    },
  ],
});
