import { defineCard } from "../define.js";

// The back face of The Legend of Kyoshi. Its mana ability makes all X in one
// colour, the player's pick ("any one color").
const LANDS_TEXT = "Lands you control have trample and hexproof.";
const MANA_TEXT = "{T}: Add X mana of any one color, where X is the greatest power among creatures you control.";

export default defineCard({
  name: "Avatar Kyoshi",
  art: "https://cards.scryfall.io/art_crop/back/4/8/4887ce64-7c98-4bd7-95db-0c43ab71cc6e.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 5,
  toughness: 4,
  text: `${LANDS_TEXT}\n${MANA_TEXT}`,
  static: [{ affects: { scope: "lands-you-control" }, grantKeywords: ["trample", "hexproof"], text: LANDS_TEXT }],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  faces: ["The Legend of Kyoshi", "Avatar Kyoshi"],
  transform: true,
});
