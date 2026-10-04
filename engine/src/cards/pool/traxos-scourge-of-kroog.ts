import { defineCard } from "../define.js";

// EDHREC rank 3948.
//
// Rulings:
//   [2018-04-27] Some abilities trigger "whenever you cast a historic spell." Such an ability
//     resolves before the spell that caused it to trigger. It resolves even if that spell is
//     countered.
//   [2018-04-27] Lands are never cast, so abilities that trigger "whenever you cast a historic
//     spell" won't trigger if you play a legendary land. They also won't trigger if a card on the
//     battlefield transforms into a legendary land, as the Ixalan and Rivals of Ixalan
//     double-faced cards do.
//   [2018-04-27] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype. Having two of those qualities doesn't make an
//     object more historic than another or provide an additional bonus—an object either is
//     historic or it isn't.
//   [2018-04-27] An ability that triggers "whenever you cast a historic spell" doesn't trigger if
//     a historic card is put onto the battlefield without being cast.
//
// Historic (rule 700.6) is Jhoira, Weatherlight Captain's filter.
const ENTER_TEXT = "Traxos enters tapped and doesn't untap during your untap step.";
const CAST_TEXT =
  "Whenever you cast a historic spell, untap Traxos. (Artifacts, legendaries, and Sagas are historic.)";

export default defineCard({
  name: "Traxos, Scourge of Kroog",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Dragon", "Construct"],
  power: 7,
  toughness: 7,
  keywords: ["trample"],
  text: `Trample\n${ENTER_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Traxos enters tapped.",
    },
    {
      affects: { scope: "self" },
      doesntUntap: true,
      text: "Traxos doesn't untap during your untap step.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
