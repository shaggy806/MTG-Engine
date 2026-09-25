import { defineCard } from "../define.js";

export default defineCard({
  name: "S.H.I.E.L.D. Deployment Drone",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, create a 1/1 white Soldier creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Soldier creature token.",
    },
  ],
});
