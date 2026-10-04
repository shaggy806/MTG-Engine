import { defineCard } from "../define.js";
import { station, stationBand } from "../helpers.js";

// EDHREC rank 4147.
//
// Rulings:
//   [2025-07-25] If the target permanent is an illegal target as Extinguisher Battleship’s first
//     ability tries to resolve, it won’t resolve and none of its effects will happen. No creatures
//     will be dealt damage.

const ENTER_TEXT =
  "When this Spacecraft enters, destroy target noncreature permanent. Then this Spacecraft deals 4 damage to each creature.";
const STATION_TEXT =
  "Station (Tap another creature you control: Put charge counters equal to its power on this Spacecraft. " +
  "Station only as a sorcery. It's an artifact creature at 5+.)";

export default defineCard({
  name: "Extinguisher Battleship",
  manaCost: "{8}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Spacecraft"],
  power: 10,
  toughness: 10,
  text: `${ENTER_TEXT}\n${STATION_TEXT}\n5+ | Flying, trample`,
  activated: [station(STATION_TEXT)],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Its one target illegal, the whole ability doesn't resolve and no
      // damage is dealt (rule 608.2b, the ruling).
      targets: [{ kind: "permanent", filter: { notTypes: ["creature"] } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "damage-all", filter: { type: "creature" }, amount: 4 },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    stationBand(5, {
      addTypes: ["creature"],
      setBasePt: { power: 10, toughness: 10 },
      grantKeywords: ["flying", "trample"],
      text: "5+ | Flying, trample",
    }),
  ],
});
