import { defineCard } from "../define.js";

export default defineCard({
  name: "Dauntless Aven",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Warrior"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, untap target creature you control.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Whenever this creature attacks, untap target creature you control.",
    },
  ],
});
