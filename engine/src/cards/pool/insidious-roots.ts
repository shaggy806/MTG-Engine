import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// "Whenever one or more creature cards leave your graveyard" is batched:
// creature cards leaving at the same time trigger it once (its ruling), and
// a move that takes only noncreature cards doesn't trigger it at all. The
// card's type is read as it was in the graveyard.
//
// The grant reaches every creature token you control, this enchantment
// included in the rare case it is one (its other ruling) — which is why the
// scope doesn't exclude its source.
export default defineCard({
  name: "Insidious Roots",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text:
    'Creature tokens you control have "{T}: Add one mana of any color."\n' +
    "Whenever one or more creature cards leave your graveyard, create a 0/1 green Plant " +
    "creature token, then put a +1/+1 counter on each Plant you control.",
  static: [
    {
      affects: { scope: "creatures-you-control", tokenOnly: true },
      grantsActivated: [
        addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
      ],
      text: 'Creature tokens you control have "{T}: Add one mana of any color."',
    },
  ],
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Plant Token", count: 1 },
          {
            kind: "add-counter-all",
            filter: { subtype: "Plant", controlledBy: "you" },
            counter: "+1/+1",
            amount: 1,
          },
        ],
      },
      resolve: null,
      text:
        "Whenever one or more creature cards leave your graveyard, create a 0/1 green Plant " +
        "creature token, then put a +1/+1 counter on each Plant you control.",
    },
  ],
});
