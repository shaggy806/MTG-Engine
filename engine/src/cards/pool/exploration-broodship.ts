import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// Station (rule 702.184) and two station symbols (rule 721.2). The last line
// has no symbol, so it works at any number of counters: a graveyard-cast
// permission whose land sacrifice is paid after the mana, so the land may tap
// for the spell first (rule 601.2g–h). The spell keeps its own timing (the
// ruling).
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 8+.)";
const LAND_TEXT = "You may play an additional land on each of your turns.";
const GRAVEYARD_TEXT =
  "Once during each of your turns, you may cast a permanent spell from your graveyard by sacrificing a land " +
  "in addition to paying its other costs.";

export default defineCard({
  name: "Exploration Broodship",
  manaCost: "{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 4,
  toughness: 4,
  text: `${STATION_TEXT}\n3+ | ${LAND_TEXT}\n8+ | Flying\n${GRAVEYARD_TEXT}`,
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(3, { extraLandsPerTurn: 1, text: `3+ | ${LAND_TEXT}` }),
    stationBand(8, {
      addTypes: ["creature"],
      setBasePt: { power: 4, toughness: 4 },
      grantKeywords: ["flying"],
      text: "8+ | Flying",
    }),
    {
      affects: { scope: "self" },
      castFromGraveyard: {
        filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
        oncePerTurn: true,
        yourTurnOnly: true,
        sacrifice: { type: "land" },
      },
      text: GRAVEYARD_TEXT,
    },
  ],
});
