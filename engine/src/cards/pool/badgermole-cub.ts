import { defineCard } from "../define.js";

// EDHREC rank 1191. The second ability is a triggered mana ability (rule
// 605.1b): a creature's own {T} mana ability, as Crypt Ghast's is a Swamp's
// — a "tap an untapped creature you control" cost doesn't fire it (the
// rulings). A land earthbend made a creature counts.
const ENTER =
  "When this creature enters, earthbend 1. (Target land you control becomes a 0/0 creature with haste that's still a land. Put a +1/+1 counter on it. When it dies or is exiled, return it to the battlefield tapped.)";
const MANA = "Whenever you tap a creature for mana, add an additional {G}.";

export default defineCard({
  name: "Badgermole Cub",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Badger", "Mole"],
  power: 2,
  toughness: 2,
  text: `${ENTER}\n${MANA}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 1 },
      resolve: null,
      text: "When this creature enters, earthbend 1.",
    },
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: MANA,
    },
  ],
});
