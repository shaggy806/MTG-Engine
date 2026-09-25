import { defineCard } from "../define.js";

export default defineCard({
  name: "Ballista Squad",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Rebel"],
  power: 2,
  toughness: 2,
  text: "{X}{W}, {T}: This creature deals X damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: "{X}{W}", tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: "x", target: 0 },
      resolve: null,
      text: "{X}{W}, {T}: This creature deals X damage to target attacking or blocking creature.",
    },
  ],
});
