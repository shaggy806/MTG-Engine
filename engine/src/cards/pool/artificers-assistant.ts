import { defineCard } from "../define.js";

// EDHREC rank 5476.
//
// Rulings:
//   [2018-04-27] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype. Having two of those qualities doesn’t make an
//     object more historic than another or provide an additional bonus—an object either is
//     historic or it isn’t.
//   [2018-04-27] Some abilities trigger “whenever you cast a historic spell.” Such an ability
//     resolves before the spell that caused it to trigger. It resolves even if that spell is
//     countered.
//   [2018-04-27] Lands are never cast, so abilities that trigger “whenever you cast a historic
//     spell” won’t trigger if you play a legendary land. They also won’t trigger if a card on the
//     battlefield transforms into a legendary land, as the Ixalan and Rivals of Ixalan
//     double-faced cards do.
//   [2018-04-27] An ability that triggers “whenever you cast a historic spell” doesn’t trigger if
//     a historic card is put onto the battlefield without being cast.

const TEXT = "Whenever you cast a historic spell, scry 1.";

export default defineCard({
  name: "Artificer's Assistant",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT} (Artifacts, legendaries, and Sagas are historic. To scry 1, look at the top card of your library, then you may put that card on the bottom.)`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        // Historic (rule 700.6): an artifact, a legendary, or a Saga.
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
