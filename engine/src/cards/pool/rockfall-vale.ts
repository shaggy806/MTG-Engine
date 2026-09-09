import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Rockfall Vale",
  types: ["land"],
  text:
    "Rockfall Vale enters the battlefield tapped unless you control two or more other lands.\n" +
    "When Rockfall Vale enters the battlefield untapped, it deals 1 damage to you.\n" +
    "{T}: Add {R} or {G}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { type: "land" }, atLeast: 2 },
        painIfUntapped: 1,
      },
      text:
        "Rockfall Vale enters the battlefield tapped unless you control two or more other lands. " +
        "When Rockfall Vale enters the battlefield untapped, it deals 1 damage to you.",
    },
  ],
  activated: [manaTapAbility("R"), manaTapAbility("G")],
});
