import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

/** The land back face of Kazandu Mammoth. */
export default defineCard({
  name: "Kazandu Valley",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/2/f/2f632537-63bf-4490-86e6-e6067b9c1a3b.jpg",
  types: ["land"],
  text: "Kazandu Valley enters the battlefield tapped.\n{T}: Add {G}.",
  static: [entersTappedStatic("Kazandu Valley")],
  activated: [manaTapAbility("G")],
  faces: ["Kazandu Mammoth", "Kazandu Valley"],
});
