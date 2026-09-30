import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. Station only as a sorcery. It's an artifact creature at 12+.)";
const CAST_TEXT = "Whenever you cast an artifact spell, draw a card. Put a charge counter on this Spacecraft.";
const PUMP_TEXT = "This Spacecraft gets +1/+0 for each artifact you control.";

// Hearthhull's shape. The +1/+0 is printed outside the bands, but only a
// creature has power to change.
export default defineCard({
  name: "Uthros Research Craft",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 0,
  toughness: 8,
  text: `${STATION_TEXT}\n3+ | ${CAST_TEXT}\n12+ | Flying\n${PUMP_TEXT}`,
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(3, {
      grantsTriggered: [
        {
          trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "draw", amount: 1 },
              { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
            ],
          },
          resolve: null,
          text: CAST_TEXT,
        },
      ],
      text: `3+ | ${CAST_TEXT}`,
    }),
    stationBand(12, {
      addTypes: ["creature"],
      setBasePt: { power: 0, toughness: 8 },
      grantKeywords: ["flying"],
      text: "12+ | Flying",
    }),
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "artifact", controlledBy: "you" }, pt: [1, 0] },
      text: PUMP_TEXT,
    },
  ],
});
