import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const TEXT = "{R}, {T}: Target legendary creature gains first strike until end of turn.";

export default defineCard({
  name: "Shinka, the Bloodsoaked Keep",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {R}.\n${TEXT}`,
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: "{R}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
