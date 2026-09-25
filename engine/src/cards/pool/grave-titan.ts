import { defineCard } from "../define.js";

export default defineCard({
  name: "Grave Titan",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 6,
  toughness: 6,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhenever this creature enters or attacks, create two 2/2 black Zombie creature tokens.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 2 },
      resolve: null,
      text: "Whenever this creature enters or attacks, create two 2/2 black Zombie creature tokens.",
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 2 },
      resolve: null,
      text: "Whenever this creature enters or attacks, create two 2/2 black Zombie creature tokens.",
    },
  ],
});
