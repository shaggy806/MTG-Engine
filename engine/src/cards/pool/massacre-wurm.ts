import { defineCard } from "../define.js";

// "That player" is the dead creature's controller as it last existed on the
// battlefield — the `"trigger-controller"` scope reads its last-known
// information, so a stolen creature dying drains the thief.
export default defineCard({
  name: "Massacre Wurm",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Wurm"],
  power: 6,
  toughness: 5,
  text:
    "When this creature enters, creatures your opponents control get -2/-2 until end of turn.\n" +
    "Whenever a creature an opponent controls dies, that player loses 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "opponent" },
        power: -2,
        toughness: -2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "When this creature enters, creatures your opponents control get -2/-2 until end of turn.",
    },
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, that player loses 2 life.",
    },
  ],
});
