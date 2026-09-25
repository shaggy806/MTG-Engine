import { defineCard } from "../define.js";

export default defineCard({
  name: "Deathless Angel",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 7,
  keywords: ["flying"],
  text: "Flying\n{W}{W}: Target creature gains indestructible until end of turn.",
  activated: [
    {
      cost: { mana: "{W}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      resolve: null,
      text: "{W}{W}: Target creature gains indestructible until end of turn.",
    },
  ],
});
