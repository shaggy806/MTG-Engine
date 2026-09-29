import { defineCard } from "../define.js";

/** 0/0 black Phyrexian Germ — living weapon's token (rule 702.92a): the
 * Equipment that made it is attached to it before state-based actions can
 * see a 0/0. */
export default defineCard({
  name: "Phyrexian Germ Token",
  art: "c05bed6b-da9a-4a82-9c66-df5285fd872a",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Germ"],
  power: 0,
  toughness: 0,
});
