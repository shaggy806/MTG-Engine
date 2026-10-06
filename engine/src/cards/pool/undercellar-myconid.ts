import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 6539.

const TEXT = "Whenever this creature enters or dies, create a 1/1 green Saproling creature token.";

export default defineCard({
  name: "Undercellar Myconid",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 1,
  toughness: 2,
  text: `${TEXT}\n{T}: Add one mana of any color.`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
});
