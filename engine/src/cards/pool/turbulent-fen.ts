import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Turbulent Fen",
  types: ["land"],
  subtypes: ["Swamp", "Forest"],
  text:
    "Turbulent Fen enters the battlefield tapped unless your opponents control eight or more lands.\n" +
    "{T}: Add {B} or {G}.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: {
          kind: "opponents-control-total",
          filter: { type: "land" },
          atLeast: 8,
        },
      },
      text: "Turbulent Fen enters the battlefield tapped unless your opponents control eight or more lands.",
    },
  ],
  activated: [manaTapAbility("B"), manaTapAbility("G")],
});
