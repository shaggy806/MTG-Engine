import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility, station, stationBand } from "../helpers.js";

const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Planet. Station only as a sorcery.)";
const MANA_TEXT = "{G}, {T}: Add {G} for each creature you control.";

// The 12+ ability's coloured cost keeps it off the auto-payer: it's
// activated by hand, its mana floating.
export default defineCard({
  name: "Evendo, Waking Haven",
  colors: [],
  types: ["land"],
  subtypes: ["Planet"],
  text: `This land enters tapped.\n{T}: Add {G}.\n${STATION_TEXT}\n12+ | ${MANA_TEXT}`,
  static: [
    entersTappedStatic("Evendo, Waking Haven"),
    stationBand(12, {
      grantsActivated: [
        {
          cost: { mana: "{G}", tap: true },
          targets: [],
          effect: { kind: "add-mana", mana: "G", amount: { countOf: { type: "creature", controlledBy: "you" } } },
          resolve: null,
          text: MANA_TEXT,
        },
      ],
      text: `12+ | ${MANA_TEXT}`,
    }),
  ],
  activated: [manaTapAbility("G"), station(STATION_TEXT)],
});
