import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Fell the Profane. "Pay 3 life or it enters tapped" is
 * the shock land replacement with a bigger number (`mayPayLife`). */
export default defineCard({
  name: "Fell Mire",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/a/3/a3cb782d-c459-468d-9779-9b5669abc337.jpg",
  types: ["land"],
  text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.\n{T}: Add {B}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", mayPayLife: 3 },
      text: "As this land enters, you may pay 3 life. If you don't, it enters tapped.",
    },
  ],
  activated: [manaTapAbility("B")],
  faces: ["Fell the Profane", "Fell Mire"],
});
