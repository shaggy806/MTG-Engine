import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility, station, stationBand } from "../helpers.js";

// EDHREC rank 6436.
// Makes "Robot Token".
//
// Evendo's shape. "Sacrifice a land" is Dust Bowl's cost — any land you
// control, this one included. "Creatures you control" are those there as it
// resolves, after the Robot is made (rule 611.2c), so the Robot gets it too.
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Planet. Station only as a sorcery.)";
const ROBOT_TEXT =
  "{1}{R}, {T}, Sacrifice a land: Create a 2/2 colorless Robot artifact creature token, then creatures you control get +1/+0 and gain haste until end of turn.";
const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Kavaron, Memorial World",
  colors: [],
  types: ["land"],
  subtypes: ["Planet"],
  text: `This land enters tapped.\n{T}: Add {R}.\n${STATION_TEXT}\n12+ | ${ROBOT_TEXT}`,
  static: [
    entersTappedStatic("Kavaron, Memorial World"),
    stationBand(12, {
      grantsActivated: [
        {
          cost: { mana: "{1}{R}", tap: true, sacrifice: { filter: { type: "land" } } },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "create-token", token: "Robot Token", count: 1 },
              { kind: "modify-pt-all", filter: YOURS, power: 1, toughness: 0, duration: "end-of-turn" },
              { kind: "grant-keyword-all", filter: YOURS, keyword: "haste", duration: "end-of-turn" },
            ],
          },
          resolve: null,
          text: ROBOT_TEXT,
        },
      ],
      text: `12+ | ${ROBOT_TEXT}`,
    }),
  ],
  activated: [manaTapAbility("R"), station(STATION_TEXT)],
});
