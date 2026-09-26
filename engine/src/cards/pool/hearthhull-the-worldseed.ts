import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// #25 in top-commanders.txt — a Spacecraft with a power/toughness box, so a
// legal commander (rule 903.3). Station (rule 702.184) and its two station
// symbols (rule 721.2): an artifact until it has eight charge counters, a
// 6/7 creature from then on. The land-sacrifice drain is in the 8+
// striation too.
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 8+.)";
const DRAW_TEXT = "{1}, {T}, Sacrifice a land: Draw two cards. You may play an additional land this turn.";
const CREATURE_TEXT = "Flying, vigilance, haste";
const DRAIN_TEXT = "Whenever you sacrifice a land, each opponent loses 2 life.";

export default defineCard({
  name: "Hearthhull, the Worldseed",
  manaCost: "{1}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 6,
  toughness: 7,
  text: `${STATION_TEXT}\n2+ | ${DRAW_TEXT}\n8+ | ${CREATURE_TEXT}\n${DRAIN_TEXT}`,
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(2, {
      grantsActivated: [
        {
          cost: { mana: "{1}", tap: true, sacrifice: { filter: { type: "land" } } },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "draw", amount: 2 },
              { kind: "additional-land-drop", amount: 1 },
            ],
          },
          resolve: null,
          text: DRAW_TEXT,
        },
      ],
      text: `2+ | ${DRAW_TEXT}`,
    }),
    stationBand(8, {
      addTypes: ["creature"],
      setBasePt: { power: 6, toughness: 7 },
      grantKeywords: ["flying", "vigilance", "haste"],
      grantsTriggered: [
        {
          trigger: { on: "sacrifice", who: "you", filter: { type: "land" } },
          targets: [],
          effect: { kind: "lose-life", amount: 2, who: "each-opponent" },
          resolve: null,
          text: DRAIN_TEXT,
        },
      ],
      text: `8+ | ${CREATURE_TEXT}\n${DRAIN_TEXT}`,
    }),
  ],
});
