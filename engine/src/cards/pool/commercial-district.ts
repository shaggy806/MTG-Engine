import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Commercial District",
  types: ["land"],
  text:
    "Commercial District enters the battlefield tapped.\n" +
    "When Commercial District enters the battlefield, surveil 1.\n" +
    "{T}: Add {R} or {G}.",
  static: [entersTappedStatic("Commercial District")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When Commercial District enters the battlefield, surveil 1.",
    },
  ],
  activated: [manaTapAbility("R"), manaTapAbility("G")],
});
