import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Raucous Theater",
  types: ["land"],
  subtypes: ["Swamp", "Mountain"],
  text:
    "Raucous Theater enters the battlefield tapped.\n" +
    "When Raucous Theater enters the battlefield, surveil 1.\n" +
    "{T}: Add {B} or {R}.",
  static: [entersTappedStatic("Raucous Theater")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When Raucous Theater enters the battlefield, surveil 1.",
    },
  ],
  activated: [manaTapAbility("B"), manaTapAbility("R")],
});
