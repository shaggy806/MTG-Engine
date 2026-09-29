import { defineCard } from "../define.js";
import { addManaAbility, entersTappedStatic, manaTapAbility } from "../helpers.js";

const GRANT_TEXT = 'As long as you control six or more lands, lands you control have "{T}: Add one mana of any color."';
const GODS_TEXT =
  "{W}{W}{U}{U}{B}{B}{R}{R}{G}{G}, {T}, Sacrifice this land: Search your library for any number of God cards, put them onto the battlefield, then shuffle.";

// Six or more lands counts The World Tree itself. The granted ability adds
// to the lands' own and changes none of their types (the ruling).
export default defineCard({
  name: "The World Tree",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n{T}: Add {G}.\n${GRANT_TEXT}\n${GODS_TEXT}`,
  static: [
    entersTappedStatic("The World Tree"),
    {
      affects: { scope: "lands-you-control" },
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 6, countsSelf: true },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: GRANT_TEXT,
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{W}{W}{U}{U}{B}{B}{R}{R}{G}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "God" },
        destination: "battlefield",
        min: 0,
        max: { librarySize: "you" },
      },
      resolve: null,
      text: GODS_TEXT,
    },
  ],
});
