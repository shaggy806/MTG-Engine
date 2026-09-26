import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT =
  "Whenever equipped creature attacks, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Sword of the Animist",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +1/+1.\n${ATTACK_TEXT}\nEquip {2}`,
  static: [{ affects: { scope: "attached" }, grantPt: [1, 1], text: "Equipped creature gets +1/+1." }],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
