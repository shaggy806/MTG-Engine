import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Underground Mortuary",
  types: ["land"],
  subtypes: ["Swamp", "Forest"],
  text:
    "Underground Mortuary enters the battlefield tapped.\n" +
    "When Underground Mortuary enters the battlefield, surveil 1.\n" +
    "{T}: Add {B} or {G}.",
  static: [entersTappedStatic("Underground Mortuary")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When Underground Mortuary enters the battlefield, surveil 1.",
    },
  ],
  activated: [manaTapAbility("B"), manaTapAbility("G")],
});
