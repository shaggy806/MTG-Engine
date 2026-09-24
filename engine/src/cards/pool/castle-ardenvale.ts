import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

export default defineCard({
  name: "Castle Ardenvale",
  colors: [],
  types: ["land"],
  text:
    "This land enters tapped unless you control a Plains.\n" +
    "{T}: Add {W}.\n" +
    "{2}{W}{W}, {T}: Create a 1/1 white Human creature token.",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtype: "Plains" }, atLeast: 1 },
      },
      text: "This land enters tapped unless you control a Plains.",
    },
  ],
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: "{2}{W}{W}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Human Token", count: 1 },
      resolve: null,
      text: "{2}{W}{W}, {T}: Create a 1/1 white Human creature token.",
    },
  ],
});
