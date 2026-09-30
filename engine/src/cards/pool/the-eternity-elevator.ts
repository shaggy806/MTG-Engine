import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. Station only as a sorcery.)";
const MANA_TEXT =
  "{T}: Add X mana of any one color, where X is the number of charge counters on The Eternity Elevator.";

// A Spacecraft with no power and toughness: station only unlocks its second
// mana ability. "Any one color" is `any-color`, all of it one colour.
export default defineCard({
  name: "The Eternity Elevator",
  manaCost: "{5}",
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  text: `{T}: Add {C}{C}{C}.\n${STATION_TEXT}\n20+ | ${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "{T}: Add {C}{C}{C}.",
    },
    station(STATION_TEXT),
  ],
  static: [
    stationBand(20, {
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: { kind: "add-mana", mana: "any-color", amount: { countersOn: "source", counter: "charge" } },
          resolve: null,
          text: MANA_TEXT,
        },
      ],
      text: `20+ | ${MANA_TEXT}`,
    }),
  ],
});
