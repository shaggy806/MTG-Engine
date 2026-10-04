import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// EDHREC rank 2811.

const ETB_TEXT =
  "When The Seriema enters, search your library for a legendary creature card, reveal it, put it into your hand, then shuffle.";
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 7+.)";
const LEGENDS_TEXT = "Other tapped legendary creatures you control have indestructible.";

export default defineCard({
  name: "The Seriema",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 5,
  toughness: 5,
  text: `${ETB_TEXT}\n${STATION_TEXT}\n7+ | Flying\n${LEGENDS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "legendary", type: "creature" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(7, {
      addTypes: ["creature"],
      setBasePt: { power: 5, toughness: 5 },
      grantKeywords: ["flying"],
      text: "7+ | Flying",
    }),
    // A striation runs to the next station symbol (rule 721.2): the
    // indestructible line is part of the 7+ band.
    stationBand(
      7,
      { grantKeywords: ["indestructible"], text: LEGENDS_TEXT },
      {
        scope: "filter",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you", tapped: true },
        excludeSelf: true,
      },
    ),
  ],
});
