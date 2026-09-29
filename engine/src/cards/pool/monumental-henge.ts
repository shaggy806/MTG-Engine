import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const LOOK_TEXT =
  "{2}{W}{W}, {T}: Look at the top five cards of your library. You may reveal a historic card " +
  "from among them and put it into your hand. Put the rest on the bottom of your library in a " +
  "random order.";
const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;

export default defineCard({
  name: "Monumental Henge",
  colors: [],
  types: ["land"],
  text:
    "This land enters tapped unless you control a Plains.\n{T}: Add {W}.\n" +
    `${LOOK_TEXT} (Artifacts, legendaries, and Sagas are historic.)`,
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
    addManaAbility({ mana: "W", text: "{T}: Add {W}." }),
    {
      cost: { mana: "{2}{W}{W}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 5,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: HISTORIC,
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
