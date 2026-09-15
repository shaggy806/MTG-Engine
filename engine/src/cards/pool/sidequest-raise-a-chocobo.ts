import { defineCard } from "../define.js";

/** A transforming DFC whose front face isn't a creature: an enchantment that
 * turns into `Black Chocobo` off a `step-begins` trigger with an intervening-if
 * (rule 603.4). */
export default defineCard({
  name: "Sidequest: Raise a Chocobo",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "When Sidequest: Raise a Chocobo enters the battlefield, create a 2/2 green Bird creature " +
    "token with \"Whenever a land you control enters, this token gets +1/+0 until end of turn.\"\n" +
    "At the beginning of your first main phase, if you control four or more Birds, transform " +
    "Sidequest: Raise a Chocobo.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Chocobo Bird Token", count: 1 },
      resolve: null,
      text:
        "When Sidequest: Raise a Chocobo enters the battlefield, create a 2/2 green Bird " +
        "creature token.",
    },
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      condition: {
        kind: "controls",
        filter: { subtype: "Bird", controlledBy: "you" },
        atLeast: 4,
      },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text:
        "At the beginning of your first main phase, if you control four or more Birds, " +
        "transform Sidequest: Raise a Chocobo.",
    },
  ],
  faces: ["Sidequest: Raise a Chocobo", "Black Chocobo"],
  transform: true,
});
