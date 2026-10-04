import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// EDHREC rank 2642.
// Station (rule 702.184) and two station symbols (rule 721.2). The 10+
// striation's "whenever you attack" works while it isn't yet a creature:
// it's a trigger on its controller attacking, not on Dawnsire attacking.
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 20+.)";
const ATTACK_TEXT = "Whenever you attack, Dawnsire deals 100 damage to up to one target creature or planeswalker.";

export default defineCard({
  name: "Dawnsire, Sunstar Dreadnought",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 20,
  toughness: 20,
  text: `${STATION_TEXT}\n10+ | ${ATTACK_TEXT}\n20+ | Flying`,
  activated: [station(STATION_TEXT)],
  static: [
    stationBand(10, {
      grantsTriggered: [
        {
          trigger: { on: "attack-with", who: "you", atLeast: 1 },
          targets: [{ kind: "optional", of: { kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker"] } } }],
          effect: { kind: "damage", amount: 100, target: 0 },
          resolve: null,
          text: ATTACK_TEXT,
        },
      ],
      text: `10+ | ${ATTACK_TEXT}`,
    }),
    stationBand(20, {
      addTypes: ["creature"],
      setBasePt: { power: 20, toughness: 20 },
      grantKeywords: ["flying"],
      text: "20+ | Flying",
    }),
  ],
});
