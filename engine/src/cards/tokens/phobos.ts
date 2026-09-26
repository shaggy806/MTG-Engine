import { defineCard } from "../define.js";

/**
 * The Spear of Leonidas' "Summon" token: Phobos, a legendary 3/2 red Horse.
 * A *named legendary* token like Cragflame, so the legend rule (704.5j)
 * applies to a second one.
 */
export default defineCard({
  name: "Phobos",
  art: "447bd736-6b47-440c-86ed-db54bd655274",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Horse"],
  power: 3,
  toughness: 2,
});
