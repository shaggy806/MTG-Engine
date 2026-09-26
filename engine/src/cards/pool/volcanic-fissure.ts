import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Sundering Eruption — the shock land replacement
 * with a bigger number (`mayPayLife`), as Fell Mire. */
export default defineCard({
  name: "Volcanic Fissure",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/5/0/50686ac7-346c-43d1-bdaa-28d46a12ad93.jpg",
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
  faces: ["Sundering Eruption", "Volcanic Fissure"],
});
