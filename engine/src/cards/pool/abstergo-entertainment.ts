import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const EXILE_TEXT =
  "{3}, {T}, Exile Abstergo Entertainment: Return up to one target historic card from your graveyard to your hand, then exile all graveyards.";

export default defineCard({
  name: "Abstergo Entertainment",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {C}.\n{1}, {T}: Add one mana of any color.\n${EXILE_TEXT} (Artifacts, legendaries, and Sagas are historic.)`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{3}", tap: true, exileSelf: true },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "card-in-graveyard",
            whose: "you",
            filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
          },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: 0, from: "graveyard" },
          { kind: "exile-graveyard", target: "each-player" },
        ],
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
