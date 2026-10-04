import { defineCard } from "../define.js";

// The predefined Powerstone token (Hall of Tagsin). Its mana is Karn, Legacy Reforged's
// deny-list (`notSpell`): it pays for anything but casting a nonartifact spell. Entering
// tapped isn't part of the token (the ruling) — the maker says `tapped`.

const MANA_TEXT = "{T}: Add {C}. This mana can't be spent to cast a nonartifact spell.";

export default defineCard({
  name: "Powerstone Token",
  art: "d45fe4b6-aeaf-4f84-b660-c7b482ed8512",
  colors: [],
  types: ["artifact"],
  subtypes: ["Powerstone"],
  text: MANA_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 1,
        spendOnly: { notSpell: { notTypes: ["artifact"] }, text: "This mana can't be spent to cast a nonartifact spell." },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
