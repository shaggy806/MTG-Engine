import { defineCard } from "../define.js";

export default defineCard({
  name: "Alabaster Mage",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: "{1}{W}: Target creature you control gains lifelink until end of turn. (Damage dealt by the creature also causes its controller to gain that much life.)",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: Target creature you control gains lifelink until end of turn.",
    },
  ],
});
