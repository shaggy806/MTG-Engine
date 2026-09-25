import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

// #162 in top-commanders.txt.
//
// X is read as the ability resolves. Annihilator is a triggered ability, so
// the Scions and Spawns gain it with `grant-triggered-all`.
const XP_TEXT = "Whenever Azlask or another colorless creature you control dies, you get an experience counter.";
const PUMP_TEXT =
  "{W}{U}{B}{R}{G}: Creatures you control get +X/+X until end of turn, where X is the number of experience " +
  "counters you have. Scions and Spawns you control gain indestructible and annihilator 1 until end of turn.";
const X = { playerCounters: "experience" } as const;
const spawnlings = { controlledBy: "you", subtypes: ["Scion", "Spawn"] } as const;

export default defineCard({
  name: "Azlask, the Swelling Scourge",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 2,
  toughness: 2,
  text: `${XP_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", colorless: true } },
      targets: [],
      effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
      resolve: null,
      text: XP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: X,
            toughness: X,
            duration: "end-of-turn",
          },
          { kind: "grant-keyword-all", filter: spawnlings, keyword: "indestructible", duration: "end-of-turn" },
          { kind: "grant-triggered-all", filter: spawnlings, ability: annihilator(1), duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
