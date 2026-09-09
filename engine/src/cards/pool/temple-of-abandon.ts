import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Temple of Abandon",
  types: ["land"],
  text:
    "Temple of Abandon enters the battlefield tapped.\n" +
    "When Temple of Abandon enters the battlefield, scry 1.\n" +
    "{T}: Add {R} or {G}.",
  static: [entersTappedStatic("Temple of Abandon")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When Temple of Abandon enters the battlefield, scry 1.",
    },
  ],
  activated: [manaTapAbility("R"), manaTapAbility("G")],
});
