import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const TEXT = "{3}: Return this card from your graveyard to the battlefield tapped.";

// Reassembling Skeleton's shape: the card stays in the graveyard until the
// ability resolves.
export default defineCard({
  name: "Drownyard Temple",
  types: ["land"],
  text: `{T}: Add {C}.\n${TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{3}", tap: false },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source", enterTapped: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
