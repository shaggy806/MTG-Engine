import { defineCard } from "../define.js";

const SHROUD_TEXT = "Other enchantments you control have shroud. (They can't be the targets of spells or abilities.)";
const TUTOR_TEXT =
  "{1}, Sacrifice this enchantment: Search your library for an enchantment card, reveal it, then shuffle and put that card on top.";

export default defineCard({
  name: "Sterling Grove",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  types: ["enchantment"],
  text: `${SHROUD_TEXT}\n${TUTOR_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "enchantment", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["shroud"],
      text: SHROUD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "enchantment" },
        destination: "library-top",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: TUTOR_TEXT,
    },
  ],
});
