import { defineCard } from "../define.js";

export default defineCard({
  name: "Coral Barrier",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\nWhen this creature enters, create a 1/1 blue Squid creature token with islandwalk. (It can't be blocked as long as defending player controls an Island.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Squid Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 blue Squid creature token with islandwalk.",
    },
  ],
});
