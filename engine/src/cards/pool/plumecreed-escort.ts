import { defineCard } from "../define.js";

export default defineCard({
  name: "Plumecreed Escort",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Scout"],
  power: 2,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nWhen this creature enters, target creature you control gains hexproof until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature you control gains hexproof until end of turn.",
    },
  ],
});
