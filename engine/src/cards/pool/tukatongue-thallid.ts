import { defineCard } from "../define.js";

export default defineCard({
  name: "Tukatongue Thallid",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, create a 1/1 green Saproling creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 green Saproling creature token.",
    },
  ],
});
