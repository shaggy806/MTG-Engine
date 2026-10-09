import { defineCard } from "../define.js";

/** The disturb back face of Baithook Angler. Its "exile it instead" is the
 * face's own ability (`self`), not something the disturb cast does: a Clone
 * of it is exiled too (rule 707.2), and it, having lost its abilities, isn't. */
export default defineCard({
  name: "Hook-Haunt Drifter",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/3/6/36e71d16-0964-489d-bea2-9cec7991fc99.jpg",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "If Hook-Haunt Drifter would be put into a graveyard from anywhere, exile it instead.",
  faces: ["Baithook Angler", "Hook-Haunt Drifter"],
  transform: true,
  disturb: { cost: "{1}{U}" },
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-be-put-into-graveyard", instead: "exile", self: true },
      text: "If Hook-Haunt Drifter would be put into a graveyard from anywhere, exile it instead.",
    },
  ],
});
