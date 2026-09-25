import { defineCard } from "../define.js";

export default defineCard({
  name: "Treetop Snarespinner",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 1,
  toughness: 4,
  keywords: ["reach", "deathtouch"],
  text: "Reach (This creature can block creatures with flying.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\n{2}{G}: Put a +1/+1 counter on target creature you control. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{2}{G}: Put a +1/+1 counter on target creature you control. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
