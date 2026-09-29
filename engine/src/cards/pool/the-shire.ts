import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const FOOD_TEXT = "{1}{G}, {T}, Tap an untapped creature you control: Create a Food token.";
const LEGENDARY = { kind: "controls", filter: { type: "creature", supertype: "legendary" }, atLeast: 1 } as const;

// The legendary creature has to be there already as The Shire enters; one
// entering alongside it doesn't count (the ruling — rule 614.12).
export default defineCard({
  name: "The Shire",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `The Shire enters tapped unless you control a legendary creature.\n{T}: Add {G}.\n${FOOD_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tappedUnless: LEGENDARY },
      text: "The Shire enters tapped unless you control a legendary creature.",
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{1}{G}", tap: true, tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } } },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: FOOD_TEXT,
    },
  ],
});
