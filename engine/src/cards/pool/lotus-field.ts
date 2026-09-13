import { defineCard } from "../define.js";
import { entersTappedStatic } from "../helpers.js";

export default defineCard({
  name: "Lotus Field",
  types: ["land"],
  keywords: ["hexproof"],
  text:
    "Hexproof\n" +
    "Lotus Field enters the battlefield tapped.\n" +
    "When Lotus Field enters the battlefield, sacrifice two lands.\n" +
    "{T}: Add three mana of any one color.",
  static: [entersTappedStatic("Lotus Field")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "you", filter: { type: "land" }, count: 2 },
      resolve: null,
      text: "When Lotus Field enters the battlefield, sacrifice two lands.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 3 },
      resolve: null,
      text: "{T}: Add three mana of any one color.",
    },
  ],
});
