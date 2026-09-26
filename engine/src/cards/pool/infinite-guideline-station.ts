import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// #241 in top-commanders.txt. Station (rule 702.184) and one station symbol
// (rule 721.2): a 7/15 flier from twelve charge counters on, with the attack
// trigger in the same striation. Both counts include itself, a five-colour
// permanent.
const ROBOT_TEXT =
  "When Infinite Guideline Station enters, create a tapped 2/2 colorless Robot artifact creature token for each " +
  "multicolored permanent you control.";
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 12+.)";
const DRAW_TEXT =
  "Whenever Infinite Guideline Station attacks, draw a card for each multicolored permanent you control.";
const MULTICOLORED_YOU_CONTROL = { multicolored: true, controlledBy: "you" } as const;

export default defineCard({
  name: "Infinite Guideline Station",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 7,
  toughness: 15,
  text: `${ROBOT_TEXT}\n${STATION_TEXT}\n12+ | Flying\n${DRAW_TEXT}`,
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(12, {
      addTypes: ["creature"],
      setBasePt: { power: 7, toughness: 15 },
      grantKeywords: ["flying"],
      grantsTriggered: [
        {
          trigger: { on: "attacks", who: "self" },
          targets: [],
          effect: { kind: "draw", amount: { countOf: MULTICOLORED_YOU_CONTROL } },
          resolve: null,
          text: DRAW_TEXT,
        },
      ],
      text: `12+ | Flying\n${DRAW_TEXT}`,
    }),
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Robot Token", count: { countOf: MULTICOLORED_YOU_CONTROL }, tapped: true },
      resolve: null,
      text: ROBOT_TEXT,
    },
  ],
});
