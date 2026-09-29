import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility, station, stationBand } from "../helpers.js";

const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Planet. Station only as a sorcery.)";
const MANA_TEXT = "{U}, {T}: Add {U} for each artifact you control.";

// As Evendo, Waking Haven: the 12+ ability is activated by hand.
export default defineCard({
  name: "Uthros, Titanic Godcore",
  colors: [],
  types: ["land"],
  subtypes: ["Planet"],
  text: `This land enters tapped.\n{T}: Add {U}.\n${STATION_TEXT}\n12+ | ${MANA_TEXT}`,
  static: [
    entersTappedStatic("Uthros, Titanic Godcore"),
    stationBand(12, {
      grantsActivated: [
        {
          cost: { mana: "{U}", tap: true },
          targets: [],
          effect: { kind: "add-mana", mana: "U", amount: { countOf: { type: "artifact", controlledBy: "you" } } },
          resolve: null,
          text: MANA_TEXT,
        },
      ],
      text: `12+ | ${MANA_TEXT}`,
    }),
  ],
  activated: [manaTapAbility("U"), station(STATION_TEXT)],
});
