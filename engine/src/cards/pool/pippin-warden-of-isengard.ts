import { defineCard } from "../define.js";

// EDHREC rank 4304.
// Makes Food → "Food Token".
//
// Rulings:
//   [2023-06-16] If your Commander deck has two commanders, you can only include cards whose own
//     color identities are also found in your commanders' combined color identities. If Frodo,
//     Adventurous Hobbit and Sam, Loyal Attendant are your commanders, your deck may contain cards
//     with white, black, and/or green in their color identity, but not blue or red.
//   [2023-06-16] To have two commanders, both must have the partner ability or corresponding
//     "partner with" abilities as the game begins. A creature with a "partner with" ability can't
//     partner with any creature other than its designated partner. Losing a partner ability during
//     the game doesn't cause either to cease to be your commander.
//   [2023-06-16] Both commanders start in the command zone, and the remaining 98 cards of your
//     deck are shuffled to become your library.
//   [2023-06-16] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2023-06-16] The second ability represented by the "partner with [name]" keyword modifies the
//     rules for deck construction in the Commander variant and has no function outside of that
//     variant. If a legendary creature card with "partner with [name]" is designated as your
//     commander, the named legendary creature card can also be designated as your commander. For
//     more information on the Commander variant, please visit Wizards.com/Commander.
//   [2023-06-16] Note that the target player searches their library (which may be affected by
//     effects such as that of Stranglehold) and that the card they find is revealed, even though
//     these words aren't included in the ability's reminder text.
//   [2023-06-16] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won't have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 damage from one of them, not from both of them
//     combined. Command Beacon's effect puts one into your hand from the command zone, not both.
//   [2023-06-16] "Partner with [name]" represents two abilities. The first is a triggered ability:
//     "When this permanent enters the battlefield, target player may search their library for a
//     card named [name], reveal it, put it into their hand, then shuffle their library."
//   [2023-06-16] The triggered ability of the "partner with" keyword still triggers in a Commander
//     game. If your other commander has somehow ended up in your library, you can find it. You can
//     also target another player, whether or not they have that card in their library.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token. For example, you can sacrifice Tough Cookie (an Artifact Creature — Food
//     Golem) to activate Maraleaf Rider's ability (an ability with "Sacrifice a Food" in its
//     cost).
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
//   [2024-11-08] Whatever you do, don't eat the delicious cards.
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.

// "Sacrifice four Foods" is any four Food artifacts you control (the ruling),
// Kuldotha Forgemaster's sacrifice-several cost. "Other creatures you control"
// are those there as it resolves (End-Raze Forerunners' shape).
const OTHERS = { type: "creature", controlledBy: "you" } as const;
const PUMP_TEXT =
  "{T}, Sacrifice four Foods: Other creatures you control get +3/+3 and gain haste until end of turn. Activate only as a sorcery.";

export default defineCard({
  name: "Pippin, Warden of Isengard",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Advisor"],
  power: 2,
  toughness: 2,
  pairing: { kind: "partner-with", name: "Merry, Warden of Isengard" },
  text: "Partner with Merry, Warden of Isengard (When this creature enters, target player may put Merry into their hand from their library, then shuffle.)\n{1}, {T}: Create a Food token.\n{T}, Sacrifice four Foods: Other creatures you control get +3/+3 and gain haste until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "{1}, {T}: Create a Food token.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Food" }, count: 4 } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: OTHERS, power: 3, toughness: 3, duration: "end-of-turn", exceptSource: true },
          { kind: "grant-keyword-all", filter: OTHERS, keyword: "haste", duration: "end-of-turn", exceptSource: true },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Merry, Warden of Isengard" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Merry, Warden of Isengard, reveal it, put it into their hand, then shuffle.",
    },
  ],
});
