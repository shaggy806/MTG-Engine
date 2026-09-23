import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Witch Enchanter. "Pay 3 life or it enters tapped" is
 * the shock land replacement with a bigger number (`mayPayLife`). */
export default defineCard({
  name: "Witch-Blessed Meadow",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/6/2/62061e7c-cf19-4f03-b8fa-2bdba62d6b0b.jpg",
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
  faces: ["Witch Enchanter", "Witch-Blessed Meadow"],
});
