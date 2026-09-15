import { defineCard } from "../define.js";

/** The disturb back face of Baithook Angler. The "exile it instead of putting
 * it anywhere else" clause is what `disturb` already does to a card cast that
 * way, so it needs no separate replacement. */
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
});
