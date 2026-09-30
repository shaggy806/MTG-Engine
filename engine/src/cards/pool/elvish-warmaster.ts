import { defineCard } from "../define.js";

const ENTER_TEXT =
  "Whenever one or more other Elves you control enter, create a 1/1 green Elf Warrior creature token. This ability triggers only once each turn.";
const PUMP_TEXT = "{5}{G}{G}: Elves you control get +2/+2 and gain deathtouch until end of turn.";

const ELVES = { subtype: "Elf", controlledBy: "you" } as const;

export default defineCard({
  name: "Elvish Warmaster",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Elf" }, otherOnly: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: ELVES, power: 2, toughness: 2, duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: ELVES, keyword: "deathtouch", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
