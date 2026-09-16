import { defineCard } from "../define.js";

export default defineCard({
  name: "Great Oak Guardian",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 4,
  toughness: 5,
  keywords: ["flash", "reach"],
  text:
    "Flash\nReach\n" +
    "When Great Oak Guardian enters, creatures target player controls get +2/+2 " +
    "until end of turn. Untap them.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          {
            // `controlledByTarget` names a seat; a `CardFilter`'s
            // `controlledBy` only knows "you" and "opponent".
            kind: "modify-pt-all",
            filter: { type: "creature" },
            controlledByTarget: 0,
            power: 2,
            toughness: 2,
            duration: "end-of-turn",
          },
          {
            kind: "untap-all",
            filter: { type: "creature" },
            controlledByTarget: 0,
          },
        ],
      },
      resolve: null,
      text:
        "When Great Oak Guardian enters, creatures target player controls get +2/+2 " +
        "until end of turn. Untap them.",
    },
  ],
});
