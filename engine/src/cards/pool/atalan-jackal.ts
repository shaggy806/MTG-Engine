import { defineCard } from "../define.js";

export default defineCard({
  name: "Atalan Jackal",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Human", "Tyranid", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["trample", "haste"],
  text: "Trample, haste\nSkilled Outrider — Whenever this creature deals combat damage to a player, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "Skilled Outrider — Whenever this creature deals combat damage to a player, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
