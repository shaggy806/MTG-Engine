import { defineCard } from "../define.js";

// needed-cards P16. No new vocab — playFromGraveyard, a landfall
// create-token trigger, and the token's own "may mill" attack trigger were
// all already shipped.
export default defineCard({
  name: "Mole Man, Moloid Master",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Villain"],
  power: 1,
  toughness: 1,
  text:
    "You may play lands from your graveyard.\n" +
    "Landfall — Whenever a land you control enters, create a 1/1 green Minion " +
    'creature token named Moloid with "Whenever this token attacks, you may mill a card."',
  static: [
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land" },
      text: "You may play lands from your graveyard.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Moloid", count: 1 },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, create a 1/1 green Minion " +
        'creature token named Moloid with "Whenever this token attacks, you may mill a card."',
    },
  ],
});
