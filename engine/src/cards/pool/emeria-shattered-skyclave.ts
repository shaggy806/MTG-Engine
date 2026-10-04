import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Emeria's Call — Fell Mire's shape. */
export default defineCard({
  name: "Emeria, Shattered Skyclave",
  art: "https://cards.scryfall.io/art_crop/back/c/4/c470539a-9cc7-4175-8f7c-c982b6072b6d.jpg",
  colors: [],
  types: ["land"],
  text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {W}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", mayPayLife: 3 },
      text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.",
    },
  ],
  activated: [manaTapAbility("W")],
  faces: ["Emeria's Call", "Emeria, Shattered Skyclave"],
});
