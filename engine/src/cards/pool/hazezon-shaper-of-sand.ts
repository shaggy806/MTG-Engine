import { defineCard } from "../define.js";

// #289 in top-commanders.txt. Three abilities, each already vocabulary:
// desertwalk is a landwalk keyword (`combat/eligibility.ts`'s LANDWALK),
// playing Deserts from the graveyard is Ramunap Excavator's
// `playFromGraveyard` narrowed to one land type, and the token trigger is a
// filtered enters-the-battlefield trigger.
//
// The graveyard permission changes only *where* the land can be played from:
// it still takes the turn's land drop at sorcery timing (the card's first
// ruling), and it grants no way to activate a land card's abilities from the
// graveyard, cycling included (its second) — a `playFromGraveyard` static
// does neither. The trigger watches any Desert entering under your control,
// played or put there by an effect alike, as the card says "enters".
const WALK_TEXT =
  "Desertwalk (This creature can't be blocked as long as defending player controls a Desert.)";
const PLAY_TEXT = "You may play Desert lands from your graveyard.";
const TOKEN_TEXT =
  "Whenever a Desert you control enters, create two 1/1 red, green, and white Sand Warrior " +
  "creature tokens.";

export default defineCard({
  name: "Hazezon, Shaper of Sand",
  manaCost: "{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["desertwalk"],
  text: `${WALK_TEXT}\n${PLAY_TEXT}\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land", subtype: "Desert" },
      text: PLAY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Desert" } },
      targets: [],
      effect: { kind: "create-token", token: "Sand Warrior Token", count: 2 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
