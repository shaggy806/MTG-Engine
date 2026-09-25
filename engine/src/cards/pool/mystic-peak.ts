import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Pinnacle Monk. */
export default defineCard({
  name: "Mystic Peak",
  art: "https://cards.scryfall.io/art_crop/back/2/4/24d4f26e-7f96-4b38-867e-4fac819b2679.jpg",
  types: ["land"],
  text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {R}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", mayPayLife: 3 },
      text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.",
    },
  ],
  activated: [manaTapAbility("R")],
  faces: ["Pinnacle Monk", "Mystic Peak"],
});
