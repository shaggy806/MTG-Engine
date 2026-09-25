import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragonlair Spider",
  manaCost: "{2}{R}{R}{G}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 5,
  toughness: 6,
  keywords: ["reach"],
  text: "Reach\nWhenever an opponent casts a spell, create a 1/1 green Insect creature token.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 1 },
      resolve: null,
      text: "Whenever an opponent casts a spell, create a 1/1 green Insect creature token.",
    },
  ],
});
