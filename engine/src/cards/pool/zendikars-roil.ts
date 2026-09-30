import { defineCard } from "../define.js";

const TEXT = "Landfall — Whenever a land you control enters, create a 2/2 green Elemental creature token.";

export default defineCard({
  name: "Zendikar's Roil",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "2/2 Green Elemental Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
