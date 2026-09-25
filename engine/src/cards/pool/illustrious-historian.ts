import { defineCard } from "../define.js";

export default defineCard({
  name: "Illustrious Historian",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text: "{5}, Exile this card from your graveyard: Create a tapped 3/2 red and white Spirit creature token.",
  activated: [
    {
      cost: { mana: "{5}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (Red-White)", count: 1, tapped: true },
      resolve: null,
      text: "{5}, Exile this card from your graveyard: Create a tapped 3/2 red and white Spirit creature token.",
      zone: "graveyard",
    },
  ],
});
