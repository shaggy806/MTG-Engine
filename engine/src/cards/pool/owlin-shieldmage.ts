import { defineCard } from "../define.js";

export default defineCard({
  name: "Owlin Shieldmage",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Bird", "Warlock"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWard—Pay 3 life. (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays 3 life.)",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { payLife: 3 } },
      resolve: null,
      text: "Ward—Pay 3 life.",
    },
  ],
});
