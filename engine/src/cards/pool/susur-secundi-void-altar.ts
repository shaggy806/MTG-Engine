import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility, station, stationBand } from "../helpers.js";

const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Planet. Station only as a sorcery.)";
const DRAW_TEXT =
  "{1}{B}, {T}, Pay 2 life, Sacrifice a creature: Draw cards equal to the sacrificed creature's power. Activate only as a sorcery.";

// Evendo's shape. The power is the sacrificed creature's as it last existed.
export default defineCard({
  name: "Susur Secundi, Void Altar",
  colors: [],
  types: ["land"],
  subtypes: ["Planet"],
  text: `This land enters tapped.\n{T}: Add {B}.\n${STATION_TEXT}\n12+ | ${DRAW_TEXT}`,
  static: [
    entersTappedStatic("Susur Secundi, Void Altar"),
    stationBand(12, {
      grantsActivated: [
        {
          cost: { mana: "{1}{B}", tap: true, payLife: 2, sacrifice: "creature-you-control" },
          sorcerySpeed: true,
          targets: [],
          effect: { kind: "draw", amount: { powerOf: "sacrificed" } },
          resolve: null,
          text: DRAW_TEXT,
        },
      ],
      text: `12+ | ${DRAW_TEXT}`,
    }),
  ],
  activated: [manaTapAbility("B"), station(STATION_TEXT)],
});
