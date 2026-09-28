import { defineCard } from "../define.js";

const REGEN_TEXT = "{G}: Regenerate another target Elf.";
const PUMP_TEXT = "{2}{G}{G}{G}: Elf creatures you control get +3/+3 and gain trample until end of turn.";
const ELVES = { type: "creature", subtype: "Elf", controlledBy: "you" } as const;

export default defineCard({
  name: "Ezuri, Renegade Leader",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${REGEN_TEXT}\n${PUMP_TEXT}`,
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [{ kind: "other", of: { kind: "permanent", filter: { subtype: "Elf" } } }],
      effect: { kind: "regenerate", target: 0 },
      resolve: null,
      text: REGEN_TEXT,
    },
    {
      cost: { mana: "{2}{G}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: ELVES, power: 3, toughness: 3, duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: ELVES, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
