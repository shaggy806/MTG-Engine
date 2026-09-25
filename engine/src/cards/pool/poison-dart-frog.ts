import { defineCard } from "../define.js";

export default defineCard({
  name: "Poison Dart Frog",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Frog"],
  power: 1,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach\n{T}: Add one mana of any color.\n{2}: This creature gains deathtouch until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}: This creature gains deathtouch until end of turn.",
    },
  ],
});
