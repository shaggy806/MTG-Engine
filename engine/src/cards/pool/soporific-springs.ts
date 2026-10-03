import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Sink into Stupor. "Pay 3 life or it enters tapped"
 * is the shock land replacement with a bigger number (`mayPayLife`). */
export default defineCard({
  name: "Soporific Springs",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/5/3/5358b87a-1a29-426d-b165-40c97da2c14d.jpg",
  types: ["land"],
  text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {U}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", mayPayLife: 3 },
      text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.",
    },
  ],
  activated: [manaTapAbility("U")],
  faces: ["Sink into Stupor", "Soporific Springs"],
});
