import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// #165 in top-commanders.txt. Station (rule 702.184) and two station symbols
// (rule 721.2): the first grants the combat trigger, the second makes it a
// 5/5 flier. With no artifact targeted ("up to one"), there's no counter to
// choose.
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 8+.)";
const COMBAT_TEXT =
  "At the beginning of combat on your turn, put your choice of a +1/+1 counter or two charge counters on up to " +
  "one other target artifact.";
const ARTIFACTS_TEXT = "Other artifacts you control have hexproof and indestructible.";

export default defineCard({
  name: "Inspirit, Flagship Vessel",
  manaCost: "{U}{R}{W}",
  colors: ["W", "U", "R"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 5,
  toughness: 5,
  text: `${STATION_TEXT}\n1+ | ${COMBAT_TEXT}\n8+ | Flying\n${ARTIFACTS_TEXT}`,
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(1, {
      grantsTriggered: [
        {
          trigger: { on: "step-begins", step: "begin-combat", who: "you" },
          targets: [{ kind: "optional", of: { kind: "other", of: { kind: "permanent", filter: { type: "artifact" } } } }],
          effect: {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: {} },
            then: {
              kind: "modal",
              minModes: 1,
              maxModes: 1,
              modes: [
                { text: "A +1/+1 counter", effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 } },
                { text: "Two charge counters", effect: { kind: "add-counter", target: 0, counter: "charge", amount: 2 } },
              ],
            },
          },
          resolve: null,
          text: COMBAT_TEXT,
        },
      ],
      text: `1+ | ${COMBAT_TEXT}`,
    }),
    stationBand(8, {
      addTypes: ["creature"],
      setBasePt: { power: 5, toughness: 5 },
      grantKeywords: ["flying"],
      text: "8+ | Flying",
    }),
    {
      affects: { scope: "filter", filter: { type: "artifact", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["hexproof", "indestructible"],
      text: ARTIFACTS_TEXT,
    },
  ],
});
