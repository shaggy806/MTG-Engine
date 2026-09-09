import { defineCard } from "../define.js";

export default defineCard({
  name: "Craterhoof Behemoth",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 5,
  keywords: ["haste"],
  text:
    "Haste\n" +
    "When Craterhoof Behemoth enters, creatures you control gain trample and " +
    "get +X/+X until end of turn, where X is the number of creatures you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "trample",
            duration: "end-of-turn",
          },
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: { countOf: { type: "creature", controlledBy: "you" } },
            toughness: { countOf: { type: "creature", controlledBy: "you" } },
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text:
        "When Craterhoof Behemoth enters, creatures you control gain trample " +
        "and get +X/+X until end of turn, where X is the number of creatures " +
        "you control.",
    },
  ],
});
