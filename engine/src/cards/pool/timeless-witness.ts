import { defineCard } from "../define.js";
import { eternalizeAbility } from "../helpers.js";

// Eternalize (rule 702.129) is `eternalizeAbility`: the 4/4 black Zombie copy
// keeps the enters trigger, so it returns a card too.
const ENTERS_TEXT = "When this creature enters, return target card from your graveyard to your hand.";
const ETERNALIZE_TEXT =
  "Eternalize {5}{G}{G} ({5}{G}{G}, Exile this card from your graveyard: Create a token that's a " +
  "copy of it, except it's a 4/4 black Zombie Human Shaman with no mana cost. Eternalize only as " +
  "a sorcery.)";

export default defineCard({
  name: "Timeless Witness",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text: `${ENTERS_TEXT}\n${ETERNALIZE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
  activated: [eternalizeAbility("{5}{G}{G}", ETERNALIZE_TEXT)],
});
