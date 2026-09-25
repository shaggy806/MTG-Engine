import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** The land back face of Boggart Trawler. */
export default defineCard({
  name: "Boggart Bog",
  art: "https://cards.scryfall.io/art_crop/back/d/0/d0d484a6-5610-4f1d-95ec-eda273c255e4.jpg",
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
  faces: ["Boggart Trawler", "Boggart Bog"],
});
