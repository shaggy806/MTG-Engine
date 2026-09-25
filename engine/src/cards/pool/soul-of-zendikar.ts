import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul of Zendikar",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 6,
  toughness: 6,
  keywords: ["reach"],
  text: "Reach\n{3}{G}{G}: Create a 3/3 green Beast creature token.\n{3}{G}{G}, Exile this card from your graveyard: Create a 3/3 green Beast creature token.",
  activated: [
    {
      cost: { mana: "{3}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
      resolve: null,
      text: "{3}{G}{G}: Create a 3/3 green Beast creature token.",
    },
    {
      cost: { mana: "{3}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
      resolve: null,
      text: "{3}{G}{G}, Exile this card from your graveyard: Create a 3/3 green Beast creature token.",
      zone: "graveyard",
    },
  ],
});
