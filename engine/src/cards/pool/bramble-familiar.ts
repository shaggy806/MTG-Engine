import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** An Adventure card (rule 715): cast the adventure half (`Fetch Quest`)
 * first and the card is exiled, then cast the creature from exile later. */
export default defineCard({
  name: "Bramble Familiar",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Raccoon"],
  power: 2,
  toughness: 2,
  text: "{T}: Add {G}.\n{1}{G}, {T}, Discard a card: Return this creature to its owner's hand.",
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{1}{G}", tap: true, discard: { count: 1 } },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{1}{G}, {T}, Discard a card: Return this creature to its owner's hand.",
    },
  ],
  faces: ["Bramble Familiar", "Fetch Quest"],
  adventure: true,
});
