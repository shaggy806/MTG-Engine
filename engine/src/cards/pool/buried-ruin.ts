import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// Real text targets a card in a graveyard, which has no `TargetSpec`
// (AUTHORING §15) — the card is chosen as the ability resolves instead. See
// `regrowth.ts`.
export default defineCard({
  name: "Buried Ruin",
  types: ["land"],
  text:
    "{T}: Add {C}.\n" +
    "{2}, {T}, Sacrifice Buried Ruin: Return target artifact card from your graveyard to your hand.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text:
        "{2}, {T}, Sacrifice Buried Ruin: Return target artifact card from your graveyard to " +
        "your hand.",
    },
  ],
});
