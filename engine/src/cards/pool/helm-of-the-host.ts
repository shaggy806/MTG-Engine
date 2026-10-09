import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// Family Matters. "A copy of equipped creature" is `of: "equipped"`, which
// follows the Helm's rulings: the creature it equips as the ability
// resolves (none, if that creature has left), or — the Helm gone — the one
// it last equipped, read as it last existed if that's gone too. "Isn't
// legendary" is a copy exception, so a copy of the token isn't either; the
// haste it gains is an effect on it with no end, not copiable (its rulings).
const TEXT =
  "At the beginning of combat on your turn, create a token that's a copy of equipped creature, except the token isn't legendary. That token gains haste.";

export default defineCard({
  name: "Helm of the Host",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {5}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "create-token-copy", of: "equipped", count: 1, notLegendary: true, gains: { keywords: ["haste"] } },
      resolve: null,
      text: TEXT,
    },
  ],
  activated: [equip("{5}")],
});
