import { defineCard } from "../define.js";

export default defineCard({
  name: "Onyx Mage",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: "{1}{B}: Target creature you control gains deathtouch until end of turn. (Any amount of damage it deals to a creature is enough to destroy it.)",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{B}: Target creature you control gains deathtouch until end of turn.",
    },
  ],
});
