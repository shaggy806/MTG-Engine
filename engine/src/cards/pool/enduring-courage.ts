import { defineCard } from "../define.js";
import { enduringReturn } from "../helpers.js";

const HASTE_TEXT = "Whenever another creature you control enters, it gets +2/+0 and gains haste until end of turn.";

export default defineCard({
  name: "Enduring Courage",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["enchantment", "creature"],
  subtypes: ["Dog", "Glimmer"],
  power: 3,
  toughness: 3,
  text: `${HASTE_TEXT}\n${enduringReturn("Enduring Courage").text}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: "trigger-object", power: 2, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: "trigger-object", keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: HASTE_TEXT,
    },
    enduringReturn("Enduring Courage"),
  ],
});
