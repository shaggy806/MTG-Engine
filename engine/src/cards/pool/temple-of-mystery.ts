import { defineCard } from "../define.js";
import { entersTappedStatic, manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Temple of Mystery",
  types: ["land"],
  text:
    "Temple of Mystery enters the battlefield tapped.\n" +
    "When Temple of Mystery enters the battlefield, scry 1.\n" +
    "{T}: Add {G} or {U}.",
  static: [entersTappedStatic("Temple of Mystery")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When Temple of Mystery enters the battlefield, scry 1.",
    },
  ],
  activated: [manaTapAbility("G"), manaTapAbility("U")],
});
