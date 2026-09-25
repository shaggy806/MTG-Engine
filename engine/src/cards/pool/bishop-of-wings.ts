import { defineCard } from "../define.js";

export default defineCard({
  name: "Bishop of Wings",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 4,
  text: "Whenever an Angel you control enters, you gain 4 life.\nWhenever an Angel you control dies, create a 1/1 white Spirit creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Angel" } },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "Whenever an Angel you control enters, you gain 4 life.",
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Angel" } },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "Whenever an Angel you control dies, create a 1/1 white Spirit creature token with flying.",
    },
  ],
});
