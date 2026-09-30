import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const ENTER_TEXT =
  "When this enchantment enters, create X 1/1 colorless Shapeshifter creature tokens with changeling.";
const GRANT_TEXT = 'Creature tokens you control have "{T}: Add one mana of any color."';

export default defineCard({
  name: "Springleaf Parade",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ENTER_TEXT} (They're every creature type.)\n${GRANT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Shapeshifter Token", count: "x" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", token: true, controlledBy: "you" } },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: GRANT_TEXT,
    },
  ],
});
