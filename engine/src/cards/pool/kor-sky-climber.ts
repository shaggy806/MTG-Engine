import { defineCard } from "../define.js";

export default defineCard({
  name: "Kor Sky Climber",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Soldier", "Ally"],
  power: 3,
  toughness: 2,
  text: "{1}{W}: This creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: This creature gains flying until end of turn.",
    },
  ],
});
