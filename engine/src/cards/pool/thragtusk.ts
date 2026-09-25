import { defineCard } from "../define.js";

export default defineCard({
  name: "Thragtusk",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 3,
  text: "When this creature enters, you gain 5 life.\nWhen this creature leaves the battlefield, create a 3/3 green Beast creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "When this creature enters, you gain 5 life.",
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
      resolve: null,
      text: "When this creature leaves the battlefield, create a 3/3 green Beast creature token.",
    },
  ],
});
