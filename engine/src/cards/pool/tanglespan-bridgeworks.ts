import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Bridgeworks Battle. */
export default defineCard({
  name: "Tanglespan Bridgeworks",
  art: "https://cards.scryfall.io/art_crop/back/e/b/ebef3db0-2b58-4581-a79c-fbca9a059e63.jpg",
  types: ["land"],
  text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {G}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", mayPayLife: 3 },
      text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.",
    },
  ],
  activated: [manaTapAbility("G")],
  faces: ["Bridgeworks Battle", "Tanglespan Bridgeworks"],
});
