import { defineCard } from "../define.js";

// EDHREC rank 3502.
//
// Rulings:
//   [2014-07-18] You can activate the last ability only if the Soul is in your graveyard.
//   [2014-07-18] Exiling the Soul from your graveyard is part of the last ability's activation
//     cost. A player can't remove the Soul in response to prevent you from activating the ability.

export default defineCard({
  name: "Soul of New Phyrexia",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Avatar"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: "Trample\n{5}: Permanents you control gain indestructible until end of turn.\n{5}, Exile this card from your graveyard: Permanents you control gain indestructible until end of turn.",
  activated: [
    {
      cost: { mana: "{5}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{5}: Permanents you control gain indestructible until end of turn.",
    },
    {
      cost: { mana: "{5}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{5}, Exile this card from your graveyard: Permanents you control gain indestructible until end of turn.",
      zone: "graveyard",
    },
  ],
});
