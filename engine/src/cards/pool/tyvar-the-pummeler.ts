import { defineCard } from "../define.js";

// EDHREC rank 2963.
//
// Rulings:
//   [2024-09-20] You can activate Tyvar's first ability even if Tyvar is already tapped.
//   [2024-09-20] The value of X is calculated only once, as Tyvar's last ability resolves.

const TAP_TEXT = "Tap another untapped creature you control: Tyvar gains indestructible until end of turn. Tap it.";
const PUMP_TEXT =
  "{3}{G}{G}: Creatures you control get +X/+X until end of turn, where X is the greatest power among creatures you control.";

export default defineCard({
  name: "Tyvar, the Pummeler",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${TAP_TEXT}\n${PUMP_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "source", keyword: "indestructible", duration: "end-of-turn" },
          { kind: "tap", target: "source" },
        ],
      },
      resolve: null,
      text: TAP_TEXT,
    },
    {
      cost: { mana: "{3}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
        toughness: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
