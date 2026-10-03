# Cards to check by hand

Status: **open checklist**, started 2026-10-03. The cards below are worth playing by hand once the
scenario builder lands (`BACKLOG.md`, Client / UI: build a board from scratch, then play it). The
engine's tests cover the rules; these entries cover what a player sees — a prompt that appears,
reads clearly and offers exactly the legal options, and a board and log that end up right — and the
rules calls a player would notice if the engine got them wrong.

How to use it:

- **New decision** entries come first in each section: the card raises a choice through a client
  path that's new or rarely exercised. **Rules call** entries are interactions where the engine made
  a careful ruling.
- **Setup** is in game terms, enough to build the board in the scenario builder. Until it exists,
  `dev-rooms`' command port can build most of them (`spawn`, `move`, `life` —
  `server/scripts/dev-rooms.mjs`).
- **Known limits** are documented engine limitations (`engine/src/cards/AUTHORING.md` §15,
  `BACKLOG.md`), not bugs to report.
- Once an entry checks out, delete it; if something's wrong, add a line to `BACKLOG.md` and keep the
  entry. Each authoring pass adds entries here for the decisions and rules calls it introduces.

## Index

| cards | kind | section |
|---|---|---|
| [Feather, the Redeemed](#feather-the-redeemed) | new decision | Spells, copies and mana from unusual places |
| [Zada, Hedron Grinder](#zada-hedron-grinder) | new decision | Spells, copies and mana from unusual places |
| [Ivy, Gleeful Spellthief](#ivy-gleeful-spellthief) | new decision | Spells, copies and mana from unusual places |
| [Krark, the Thumbless](#krark-the-thumbless) | new decision | Spells, copies and mana from unusual places |
| [Rebuff the Wicked, Dawn Charm, Season of Growth](#rebuff-the-wicked-dawn-charm-season-of-growth) | new decision | Spells, copies and mana from unusual places |
| [Sevinne's Reclamation](#sevinnes-reclamation) | new decision | Spells, copies and mana from unusual places |
| [Glarb, Calamity's Augur](#glarb-calamitys-augur) | new decision | Spells, copies and mana from unusual places |
| [Thundermane Dragon, Korlessa, Scale Singer, Sigarda, Font of Blessings, Realmwalker, Emperor Mihail II, Hakoda, Selfless Commander, Elven Chorus, Crystal Skull, Isu Spyglass, Mystic Forge](#thundermane-dragon-korlessa-scale-singer-sigarda-font-of-blessings-realmwalker-emperor-mihail-ii-hakoda-selfless-commander-elven-chorus-crystal-skull-isu-spyglass-mystic-forge) | new decision | Spells, copies and mana from unusual places |
| [Gonti, Canny Acquisitor, Outrageous Robbery](#gonti-canny-acquisitor-outrageous-robbery) | new decision | Spells, copies and mana from unusual places |
| [Grenzo, Havoc Raiser, Stolen Strategy, Laughing Jasper Flint](#grenzo-havoc-raiser-stolen-strategy-laughing-jasper-flint) | new decision | Spells, copies and mana from unusual places |
| [You Find Some Prisoners](#you-find-some-prisoners) | new decision | Spells, copies and mana from unusual places |
| [Tinybones, Bauble Burglar](#tinybones-bauble-burglar) | new decision | Spells, copies and mana from unusual places |
| [Kalamax, the Stormsire, Stella Lee, Wild Card](#kalamax-the-stormsire-stella-lee-wild-card) | rules call | Spells, copies and mana from unusual places |
| [Fire Lord Azula, Alania, Divergent Storm](#fire-lord-azula-alania-divergent-storm) | rules call | Spells, copies and mana from unusual places |
| [Imodane, the Pyrohammer](#imodane-the-pyrohammer) | rules call | Spells, copies and mana from unusual places |
| [Reflections of Littjara, Volo, Guide to Monsters](#reflections-of-littjara-volo-guide-to-monsters) | rules call | Spells, copies and mana from unusual places |
| [Vizier of the Menagerie, Chromatic Orrery](#vizier-of-the-menagerie-chromatic-orrery) | rules call | Spells, copies and mana from unusual places |
| [Grolnok, the Omnivore](#grolnok-the-omnivore) | rules call | Spells, copies and mana from unusual places |
| [Haldan, Avid Arcanist, Pako, Arcane Retriever](#haldan-avid-arcanist-pako-arcane-retriever) | rules call | Spells, copies and mana from unusual places |
| [Cut Your Losses](#cut-your-losses) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Silverquill, the Disputant, Anhelo, the Painter](#silverquill-the-disputant-anhelo-the-painter) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Venerated Rotpriest](#venerated-rotpriest) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Mockingbird, Deceptive Frostkite, Malleable Impostor, Glasspool Mimic // Glasspool Shore, Stunt Double](#mockingbird-deceptive-frostkite-malleable-impostor-glasspool-mimic--glasspool-shore-stunt-double) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Phyrexian Metamorph, Clever Impersonator, Sculpting Steel, Copy Artifact, Masterwork of Ingenuity, Vesuva](#phyrexian-metamorph-clever-impersonator-sculpting-steel-copy-artifact-masterwork-of-ingenuity-vesuva) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Copy Enchantment, Mirrormade](#copy-enchantment-mirrormade) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Estrid's Invocation, Altered Ego](#estrids-invocation-altered-ego) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Ghalta and Mavren, Auton Soldier](#ghalta-and-mavren-auton-soldier) | new decision | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Karumonix, the Rat King, Blightbelly Rat, Bilious Skulldweller](#karumonix-the-rat-king-blightbelly-rat-bilious-skulldweller) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Bloated Contaminator, Contaminant Grafter, Tyrranax Rex](#bloated-contaminator-contaminant-grafter-tyrranax-rex) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Bloodroot Apothecary](#bloodroot-apothecary) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [White Sun's Twilight, Mirrex, Phyrexian Mite token](#white-suns-twilight-mirrex-phyrexian-mite-token) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Obeka, Splitter of Seconds](#obeka-splitter-of-seconds) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Sakashima of a Thousand Faces, Spark Double, Clone (for comparison)](#sakashima-of-a-thousand-faces-spark-double-clone-for-comparison) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Sakashima the Impostor](#sakashima-the-impostor) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Phantasmal Image, Clone (for comparison)](#phantasmal-image-clone-for-comparison) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Cursed Mirror](#cursed-mirror) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Aeve, Progenitor Ooze](#aeve-progenitor-ooze) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Prime Speaker Zegana, Tangleweave Armor](#prime-speaker-zegana-tangleweave-armor) | rules call | Toxic, casualty, extra upkeeps and copy-on-enter |
| [Sai, Master Thopterist, Ornithopter, Treasure Token](#sai-master-thopterist-ornithopter-treasure-token) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Jarad, Golgari Lich Lord, Metalwork Colossus, Overgrown Tomb](#jarad-golgari-lich-lord-metalwork-colossus-overgrown-tomb) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Priest of Forgotten Gods](#priest-of-forgotten-gods) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Grim Hireling, Magda, Brazen Outlaw, Axgard Cavalry, Shivan Dragon](#grim-hireling-magda-brazen-outlaw-axgard-cavalry-shivan-dragon) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Ruthless Technomancer](#ruthless-technomancer) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Stormshriek Feral, Flush Out, Marang River Regent, Coil and Catch, Whirlwing Stormbrood, Dynamic Soar, Bloomvine Regent, Claim Territory, Twincast, Counterspell, Run Away Together](#stormshriek-feral-flush-out-marang-river-regent-coil-and-catch-whirlwing-stormbrood-dynamic-soar-bloomvine-regent-claim-territory-twincast-counterspell-run-away-together) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Glorybringer, Combat Celebrant, Stormbreath Dragon](#glorybringer-combat-celebrant-stormbreath-dragon) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Skarrgan Hellkite](#skarrgan-hellkite) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Dragonlord Atarka, Inferno Titan](#dragonlord-atarka-inferno-titan) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Kotis, Sibsig Champion, River Kelpie, Stormshriek Feral](#kotis-sibsig-champion-river-kelpie-stormshriek-feral) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Necromantic Selection, Reunion of the House](#necromantic-selection-reunion-of-the-house) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Protector of the Wastes, Run Away Together](#protector-of-the-wastes-run-away-together) | new decision | Sacrifice costs and the Tarkir precons' one-offs |
| [Eliminate the Competition, Young Pyromancer](#eliminate-the-competition-young-pyromancer) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Dread Return, River Kelpie](#dread-return-river-kelpie) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Westvale Abbey, Ormendahl, Profane Prince, Bastion of Remembrance](#westvale-abbey-ormendahl-profane-prince-bastion-of-remembrance) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Mondrak, Glory Dominus, Zopandrel, Hunger Dominus, Hydra Broodmaster](#mondrak-glory-dominus-zopandrel-hunger-dominus-hydra-broodmaster) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Whirlwing Stormbrood, Thundermane Dragon, Marang River Regent, Glorybringer, Grizzly Bears](#whirlwing-stormbrood-thundermane-dragon-marang-river-regent-glorybringer-grizzly-bears) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Stormbreath Dragon, Giggling Skitterspike, Giant Growth](#stormbreath-dragon-giggling-skitterspike-giant-growth) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Behind the Scenes, Sidar Kondo of Jamuraa](#behind-the-scenes-sidar-kondo-of-jamuraa) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Millikin](#millikin) | rules call | Sacrifice costs and the Tarkir precons' one-offs |
| [Lithoform Engine](#lithoform-engine) | new decision | Copying abilities, and winning and losing the game |
| [Illusionist's Bracers](#illusionists-bracers) | new decision | Copying abilities, and winning and losing the game |
| [Inalla, Archmage Ritualist, Virtue of Knowledge, Electroduplicate](#inalla-archmage-ritualist-virtue-of-knowledge-electroduplicate) | new decision | Copying abilities, and winning and losing the game |
| [Thousand-Year Storm, Brain Freeze](#thousand-year-storm-brain-freeze) | new decision | Copying abilities, and winning and losing the game |
| [Chain of Vapor](#chain-of-vapor) | new decision | Copying abilities, and winning and losing the game |
| [Sink into Stupor // Soporific Springs](#sink-into-stupor--soporific-springs) | new decision | Copying abilities, and winning and losing the game |
| [Wandering Archaic // Explore the Vastlands](#wandering-archaic--explore-the-vastlands) | new decision | Copying abilities, and winning and losing the game |
| [Thassa's Oracle](#thassas-oracle) | new decision | Copying abilities, and winning and losing the game |
| [Pact of Negation, Summoner's Pact](#pact-of-negation-summoners-pact) | new decision | Copying abilities, and winning and losing the game |
| [Mirrodin Besieged](#mirrodin-besieged) | new decision | Copying abilities, and winning and losing the game |
| [Weaver of Harmony, Virtue of Knowledge // Vantress Visions, Mirrormade](#weaver-of-harmony-virtue-of-knowledge--vantress-visions-mirrormade) | rules call | Copying abilities, and winning and losing the game |
| [Sword of Wealth and Power, Thunderclap Drake, Primal Amulet // Primal Wellspring](#sword-of-wealth-and-power-thunderclap-drake-primal-amulet--primal-wellspring) | rules call | Copying abilities, and winning and losing the game |
| [Reverberate, Dualcaster Mage, Kitsa, Otterball Elite](#reverberate-dualcaster-mage-kitsa-otterball-elite) | rules call | Copying abilities, and winning and losing the game |
| [Jin-Gitaxias, Progress Tyrant](#jin-gitaxias-progress-tyrant) | rules call | Copying abilities, and winning and losing the game |
| [Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief](#laboratory-maniac-jace-wielder-of-mysteries-platinum-angel-herald-of-eternal-dawn-notion-thief) | rules call | Copying abilities, and winning and losing the game |
| [Angel's Grace](#angels-grace) | rules call | Copying abilities, and winning and losing the game |
| [Everybody Lives!](#everybody-lives) | rules call | Copying abilities, and winning and losing the game |
| [(a player leaving during their own turn), Toxic Deluge, Pact of Negation](#a-player-leaving-during-their-own-turn-toxic-deluge-pact-of-negation) | rules call | Copying abilities, and winning and losing the game |
| [Felidar Sovereign, Test of Endurance, Triskaidekaphile, Helix Pinnacle, Simic Ascendancy, Revel in Riches, Hellkite Tyrant, Knuckles the Echidna](#felidar-sovereign-test-of-endurance-triskaidekaphile-helix-pinnacle-simic-ascendancy-revel-in-riches-hellkite-tyrant-knuckles-the-echidna) | rules call | Copying abilities, and winning and losing the game |
| [Twenty-Toed Toad, Reliquary Tower](#twenty-toed-toad-reliquary-tower) | rules call | Copying abilities, and winning and losing the game |
| [Approach of the Second Sun, Reverberate](#approach-of-the-second-sun-reverberate) | rules call | Copying abilities, and winning and losing the game |
| [Vorpal Sword, Summon: Primal Odin, Platinum Angel](#vorpal-sword-summon-primal-odin-platinum-angel) | rules call | Copying abilities, and winning and losing the game |

## Spells, copies and mana from unusual places (2026-10-03, first round)

### Feather, the Redeemed

*New decision* — cae13658 (Feather's exile as it resolves; tests a8265191, 06f4b776)

- **Setup:** Your precombat main, stack empty. Your battlefield: Feather, the Redeemed, Grizzly
  Bears, 4 each of Mountain/Forest/Island/Plains plus 2 Swamps, all untapped. Your hand: Giant
  Growth, Counterspell, Unsummon, Murderous Rider. Your graveyard: Defy Gravity. For variant (d),
  opponent's battlefield: Rest in Peace.
- **Do:** (a) Cast Giant Growth on your Bears and let it resolve, then pass to your end step. (b)
  Cast Giant Growth on the Bears again (back in hand from (a)) and Counterspell it yourself. (c)
  Cast Giant Growth on the Bears, let Feather's trigger resolve, then Unsummon Feather with Giant
  Growth still on the stack. (d) With Rest in Peace out, cast Giant Growth on the Bears. (e) Flash
  back Defy Gravity on the Bears; play it twice, picking each option once. (f) Cast Swift End
  (Murderous Rider's Adventure) on your own Bears; play it twice, picking each option once.
- **Check:** (a) Giant Growth goes to exile, not your graveyard, as it resolves. At the beginning of
  the end step a delayed trigger returns it to your hand. (b) A countered spell goes to the
  graveyard and doesn't come back (ruling: only a spell that resolves is exiled). (c) Even with
  Feather gone, the spell is exiled and returns at the end step (ruling). (d), (e) and (f) When
  another replacement would also exile the spell, you get a two-option prompt (rule 616.1). The
  header names the spell ("Giant Growth — choose one" or similar), not Feather. Option 1 is "Apply
  Feather, the Redeemed's replacement first: exile it and return it to your hand at the beginning of
  the next end step". Option 2 is "Apply the other replacement first: exile it" or, for an
  Adventure, "Exile it on an adventure instead". Feather-first: the card returns to your hand at the
  end step. Other-first: it stays exiled (flashback, Rest in Peace) or sits on an adventure, so the
  Rider can still be cast from exile later. Check that the wording makes sense to a player who
  didn't write it. A spell aimed only at an opponent's creature or a player goes to the graveyard as
  normal.
- **Known limits:** The engine has no general way to choose the order of replacement effects
  (AUTHORING §15, BACKLOG "Replacement ordering"). Feather's exile is the only case that asks. A
  spell you cast but don't own (from Gonti, Stolen Strategy and the like) goes to its owner's
  graveyard, and Feather ignores it (ruling). That is correct behaviour, not a bug.

### Zada, Hedron Grinder

*New decision* — cae13658 (copies aimed by their effect: forEachItCouldTarget; tests 6e6ce39c)

- **Setup:** Your precombat main. Your battlefield: Zada, Hedron Grinder, two Grizzly Bears,
  Argothian Enchantress (shroud), plenty of untapped green/white mana. Opponent's battlefield: a
  Grizzly Bears. Your hand: Giant Growth x2, Seeds of Strength x2, Raise the Alarm. For variant (d),
  also Counterspell in hand and blue mana.
- **Do:** (a) Cast Giant Growth targeting Zada. (b) Cast Seeds of Strength with targets Zada, Zada,
  one of your Bears. Then cast another Seeds of Strength with all three targets on Zada. (c) Cast
  Raise the Alarm, then Giant Growth on Zada again. (d) Cast Giant Growth on Zada and Counterspell
  it in response, above Zada's trigger.
- **Check:** (a) A choose-permanents prompt appears: "Order the copies of Giant Growth: pick each
  target in turn — the copy for the first goes on the stack first, and resolves last". Only your two
  Bears are offered: not the shroud Enchantress (ruling: just ignored), not the opponent's Bears,
  not Zada. The stack should then show the two copies in the order you clicked, the first-clicked
  copy lowest. Each Bears ends 5/5 and Zada 6/6. With only one other legal creature there is no
  prompt; the copy just happens. (b) Zada plus another creature isn't "only Zada", so nothing is
  copied. All three slots on Zada triggers, and each copy targets one creature with all three slots
  (rulings). (c) The two Soldier tokens are one stacked tile, but each gets its own copy. They're
  split off to be offered separately, so check that both can be clicked in the prompt (the client
  may fold them back into one tile) and that both end 4/4. (d) The copies are still made from the
  countered spell's last-known targets (rule 707.10).
- **Known limits:** Copies aren't cast, so they don't retrigger Zada or other cast triggers
  (ruling). A token stack gets split into separate tokens and may stay split on the board
  afterwards. That is expected.

### Ivy, Gleeful Spellthief

*New decision* — cae13658 (copies aimed by their effect: retargetTo; tests 6e6ce39c)

- **Setup:** Two players. Your battlefield: Ivy, Gleeful Spellthief, two Grizzly Bears, Lightning
  Greaves (unattached), a few lands. Opponent's battlefield: Grizzly Bears, lands for green and red.
  Opponent's hand: Giant Growth, Shock, Swords to Plowshares. Your hand: Seeds of Strength x2 and
  mana for them. Best with the opponent seat as a second human (hot-seat or another browser) so you
  control their casts.
- **Do:** (a) On the opponent's turn, the opponent casts Giant Growth on their own Bears. (b) The
  opponent casts Shock at your Bears. (c) Equip Lightning Greaves to Ivy (shroud), then have the
  opponent cast Giant Growth on their Bears again. (d) On your turn, cast Seeds of Strength with
  targets Bears 1, Bears 2, Bears 1; then the other Seeds with all three targets on Bears 2. (e)
  Cast a spell aimed at Ivy herself, or at a player.
- **Check:** (a) Ivy's controller (you) gets a yes/no prompt during the opponent's spell: "Copy that
  spell? The copy targets Ivy." Yes: you control the copy, it resolves first, and Ivy becomes 5/2.
  No: nothing happens. (b) The same prompt appears for Shock. Accepting puts a Shock on Ivy and
  kills her, which is why the prompt is optional. Make sure it's easy to decline. (c) Ivy isn't a
  legal target, so no copy is made, even if you answer yes (ruling). (d) Two different creatures: no
  trigger. One creature in every slot: it triggers, and every target of the copy is Ivy (rule
  707.10e): Ivy 5/4 (2/1 plus +3/+3, under her Greaves if still equipped), Bears 2 6/6. (e) A spell
  aimed at Ivy, or at a player, doesn't trigger.
- **Known limits:** A copy of an Aura spell becomes a token attached to Ivy. That path is in the
  card text but not covered by these tests, so watch it if you try it.

### Krark, the Thumbless

*New decision* — cae13658 (Krark's lost flip only while the spell is still on the stack; copy-spell newTargets)

- **Setup:** Your precombat main. Your battlefield: Krark, the Thumbless, plenty of red/blue mana.
  Opponent's battlefield: Grizzly Bears. Your hand: several Shocks and Lightning Bolts, plus
  Counterspell.
- **Do:** Cast Shock at the opponent's Bears several times, since the coin flip is random. Once,
  also counter your own Shock in response, before Krark's trigger resolves.
- **Check:** Each cast flips a coin, and the log should say who won. Lost flip: Shock returns to
  your hand, the Bears take no damage, and the card can be cast again. Won flip: a copy is made and
  you get a choose-targets prompt for it. The current target (the Bears) is kept by default, and you
  can retarget to the opponent's face or another creature. The copy resolves first; it isn't cast,
  so it doesn't retrigger Krark. Lost flip after Counterspell: nothing comes back. The card stays in
  the graveyard (ruling). Won flip after Counterspell: the copy is still made (ruling).
- **Known limits:** The flip can't be forced, so expect to repeat it. Returning the spell isn't
  countering it, so a spell that can't be countered still goes back to hand (ruling).

### Rebuff the Wicked, Dawn Charm, Season of Growth

*New decision* — cae13658 (condition:cast-spell-targets in spell target specs and cast triggers; tests 6e6ce39c)

- **Setup:** Two players, opponent as a second human if possible. Your battlefield: Season of
  Growth, Grizzly Bears x2, untapped W/G mana. Your hand: Rebuff the Wicked, Dawn Charm, Cloudshift,
  Giant Growth, Seeds of Strength, Raise the Alarm. Opponent: red mana and Shock x3, Grizzly Bears
  on their side.
- **Do:** (a) The opponent Shocks you (your face): try to target it with Rebuff and with Dawn
  Charm's third mode. (b) The opponent Shocks your Bears: try both again. (c) The opponent Shocks
  your Bears; you cast Rebuff on it, then Cloudshift the Bears above Rebuff. (d) On your turn: Giant
  Growth your Bears; Seeds of Strength across both your Bears; Raise the Alarm.
- **Check:** (a) Dawn Charm's "counter target spell that targets you" offers the Shock; Rebuff
  offers nothing. (b) Rebuff offers the Shock; Dawn Charm's mode 3 doesn't. Choosing Dawn Charm's
  mode first should then show only legal spells. (c) Cloudshift makes the Bears a new object (rule
  400.7), so Shock no longer targets a permanent you control: Rebuff doesn't resolve, and Shock then
  fizzles. (d) Season of Growth draws one card for Giant Growth, one only for Seeds across two of
  your creatures (ruling), and nothing for a spell on an opponent's creature. Raise the Alarm's two
  tokens entering together give two separate scry 1 prompts, one card at a time (ruling).
- **Known limits:** Rebuff ruling: if the targeted permanent merely becomes an illegal target but
  stays under your control, Rebuff still counters the spell.

### Sevinne's Reclamation

*New decision* — cae13658 (copy-spell target "source")

- **Setup:** Your precombat main. Your graveyard: Sevinne's Reclamation, Wall of Omens, Elvish
  Visionary. Your battlefield: 5+ lands including Plains. For the from-hand case: a second Sevinne's
  Reclamation in hand and another MV 3 or less permanent card in the graveyard.
- **Do:** (a) Cast Sevinne's Reclamation from hand on a graveyard card. (b) Flash back the graveyard
  copy ({4}{W}) targeting Wall of Omens, answer yes to the copy prompt, and retarget the copy to
  Elvish Visionary.
- **Check:** (a) From hand: the card returns and there is no copy prompt. (b) Wall of Omens returns,
  then a yes/no prompt: "Copy Sevinne's Reclamation, and choose a new target for the copy?". Then a
  choose-targets prompt. The copy's current target is shown as the Wall, now on the battlefield,
  which is no longer legal (rule 707.10c keeps it). Other MV 3 or less permanent cards in your
  graveyard are offered; pick Elvish Visionary. Wall's draw trigger resolves after the new target is
  chosen and before the copy (ruling). Then Visionary returns and draws. Only one copy is made: the
  copy wasn't cast from a graveyard (ruling). Sevinne's ends in exile (flashback).
- **Known limits:** Keeping the illegal original target makes the copy fizzle. That is correct.

### Glarb, Calamity's Augur

*New decision* — 1878f5ff + a1cb495f (cast from the library top, X floor)

- **Setup:** Your precombat main, land drop unused. Your battlefield: Glarb, Calamity's Augur, 6+
  lands of mixed colours incl. colourless-capable. Library from the top: Stonecoil Serpent, Colossal
  Dreadmaw, Forest, Grizzly Bears. Opponent sees the board from their own seat.
- **Do:** Look at your library pile. Cast Stonecoil Serpent from the top. Cast Colossal Dreadmaw.
  Play the Forest from the top. Note that Grizzly Bears can't be cast. Tap Glarb to surveil 2. View
  the board from the opponent's seat.
- **Check:** Your library shows its top card face up to you only (rule 401.5). The opponent's view
  of your library is a card back. The top card is highlighted when playable. Stonecoil Serpent: the
  X prompt won't allow X below 4 (min 4, ruling: MV must be 4 or more). Note that the input starts
  at the maximum X. Dreadmaw casts like from hand. Forest is played using your land drop, and only
  at sorcery timing. Grizzly Bears (MV 2) on top isn't highlighted and can't be cast. After each
  cast, the new top card appears.
- **Known limits:** BACKLOG: the least legal X is only searched up to the mana you can make. An X
  spell that convoke or delve could pay up to MV 4 isn't offered from the top. An X spell with
  targets tied to X (Curse of the Swine) is floored through its target count. The X input's minimum
  doesn't show that floor per target count, but the engine refuses lower values.

### Thundermane Dragon, Korlessa, Scale Singer, Sigarda, Font of Blessings, Realmwalker, Emperor Mihail II, Hakoda, Selfless Commander, Elven Chorus, Crystal Skull, Isu Spyglass, Mystic Forge

*New decision* — 1878f5ff + a1cb495f (castFromLibraryTop family)

- **Setup:** Your precombat main. One permanent at a time on your battlefield, with the matching top
  card and plenty of mana. Thundermane Dragon: Craw Wurm on top, then Grizzly Bears; Unsummon in
  hand. Korlessa: Shivan Dragon on top, and Bears. Sigarda: a Human on top; opponent with a removal
  spell. Realmwalker: in hand, with Bears and Llanowar Elves on top in turn. Emperor Mihail II:
  Coral Merfolk on top, 3+ Islands. Hakoda: an Ally on top. Elven Chorus: 2+ untapped non-sick
  creatures, Bears on top. Crystal Skull: Sol Ring, then a legendary creature on top. Mystic Forge:
  Sol Ring, then Wastes, then Bears on top.
- **Do:** For each permanent, look at the top card and cast or play it from the library pile.
  Thundermane: cast Craw Wurm from the top, attack with it, then Unsummon Thundermane. Realmwalker:
  cast it and pick Bear. Mihail: cast Coral Merfolk from the top and answer the pay-{1} prompt.
  Hakoda: sacrifice it. Mystic Forge: tap it and pay 1 life.
- **Check:** Thundermane: Wurm (power 6) is castable from the top and has haste. It can attack this
  turn, and keeps haste after Thundermane leaves (rules 400.7b, 611.3d). Bears (power 2) isn't
  castable. Korlessa: Dragons only. Sigarda: Angel/Human spells from the top. Your other permanents
  have hexproof (the opponent can't target them), but Sigarda herself can be targeted. Realmwalker:
  a type prompt as it enters. Bears castable from the top, Llanowar Elves not; a changeling would
  be. Mihail: an optional "Pay {1} to create a 1/1 blue Merfolk creature token?". Yes taps one more
  mana and makes the token; No makes nothing. Hakoda's sacrifice gives creatures +0/+5 and
  indestructible. Elven Chorus: creatures gain "{T}: Add one mana of any color". Crystal Skull:
  historic spells (artifact, legendary) only. Mystic Forge: Sol Ring castable, Wastes not playable
  (lands aren't cast, ruling), Bears not castable. Its {T}, Pay 1 life exiles the top card with no
  permission to play it.
- **Known limits:** BACKLOG "Exiling the top of a library hasn't been seen live": Mystic Forge's
  ability is now the simplest way to see that animation (a card back flaring off the pile). Worth
  watching it once. In every case, only the controller sees the top card.

### Gonti, Canny Acquisitor, Outrageous Robbery

*New decision* — 1878f5ff + a1cb495f (impulse spendAs, face-down exile)

- **Setup:** Two players. Gonti: your battlefield has Gonti, Canny Acquisitor and a Grizzly Bears,
  both able to attack, plus 5 Islands. Opponent: no blockers. Library from the top: Craw Wurm, then
  a land. For a Feather cross-check, also put Feather on your board and a Giant Growth on the
  opponent's library top. Robbery: Outrageous Robbery in your hand, 4 Swamps. Opponent's library
  from the top: Grizzly Bears, Forest.
- **Do:** Gonti: attack with both and let them connect. In postcombat main, open the OPPONENT's
  exile pile and cast the card. Robbery: cast it with X=2 at the opponent, at instant speed (e.g.
  their end step). On your turn, play and cast the exiled cards from the opponent's exile pile. View
  from the opponent's seat throughout.
- **Check:** Gonti: one trigger for both creatures. The opponent's top card goes to exile face down,
  in the opponent's exile pile (exile is split by owner). You see the card; the opponent sees only
  that there's a card (rule 406.3). Craw Wurm costs {1} less and is payable with 5 Islands (any
  type), offered as "Cast (impulse)". It enters under your control. The discount doesn't apply to
  your own cards. Feather cross-check: a Giant Growth you cast from Gonti onto your own creature
  goes to the opponent's graveyard, not exile (Feather ruling). Robbery: both cards face down to you
  only. Forest is offered as "Play land" (your land drop, sorcery timing); Bears is castable off
  Swamps. Both stay playable on later turns, as long as they're exiled.
- **Known limits:** Discoverability, not a documented limit: there's no highlight on an exile pile
  holding a playable card, so it's easy to miss a stolen card in the opponent's exile. Worth
  judging. Gonti's permission stays with the card after Gonti leaves (ruling).

### Grenzo, Havoc Raiser, Stolen Strategy, Laughing Jasper Flint

*New decision* — 1878f5ff + a1cb495f (impulse spendAs, castOnly)

- **Setup:** Two players. Grenzo: your battlefield has Grenzo, Havoc Raiser and an attack-ready
  creature, 2 Mountains. Opponent: a creature, library top Grizzly Bears (then a land on another
  try). Upkeep pair: start at the end of the opponent's turn. Your battlefield: Stolen Strategy,
  Laughing Jasper Flint, a Rogue creature, Islands only. Opponent's library from the top: Grizzly
  Bears, Forest, Lightning Bolt. Hand: Act of Treason.
- **Do:** Grenzo: connect with the creature, pick each mode on separate tries, then try to cast the
  exiled card postcombat and next turn. Upkeep: go to your upkeep and resolve both triggers, casting
  what you can this turn. Act of Treason an opponent's creature and look at its type line. Wait a
  turn.
- **Check:** Grenzo: a mode prompt when the trigger fires. The goad mode targets only creatures that
  player controls. Exile mode: the card is exiled face up and castable this turn only, with
  Mountains paying any colour. A land exiled this way can't be played (ruling), and an uncast card
  stays in exile without a permission next turn. Upkeep: two triggers. If asked to order them, any
  order. Jasper targets an opponent; X = your outlaws (Jasper is a Rogue, plus your other Rogue, so
  2). Stolen Strategy takes the opponent's top card. Spells are castable this turn only with
  off-colour mana; a land isn't playable. The stolen creature shows Mercenary in its type line (an
  outlaw). Next turn, the cards remain exiled without a permission.
- **Known limits:** None documented. Same exile-pile discoverability concern as Gonti: the cards sit
  in the opponent's exile pile.

### You Find Some Prisoners

*New decision* — 1878f5ff + a1cb495f

- **Setup:** Your turn or the opponent's (it's an instant). Your battlefield: 2+ Mountains plus
  spare red mana. Opponent's library from the top: Island, Grizzly Bears, Lightning Bolt. Opponent
  battlefield: an artifact (to see both modes).
- **Do:** Cast it with Interrogate Them, targeting the opponent. Choose one card. Then play it, once
  on this turn and once at the end of your next turn on another try. Retry choosing the Island.
- **Check:** The mode choice shows both modes. After resolving, all three cards are exiled, then a
  prompt "Choose a card you may play" shows exactly those three. The chosen card can be played
  through the end of your next turn, with Mountains paying any colour (e.g. Bears off Mountains). A
  chosen land uses your land drop. The other two stay in exile with no permission, and so does the
  chosen card if not played (ruling).
- **Known limits:** None documented.

### Tinybones, Bauble Burglar

*New decision* — 1878f5ff + a1cb495f (playFromExile with stash counters)

- **Setup:** Two players. Your battlefield: Tinybones, Bauble Burglar (not summoning sick), 6
  Swamps. Opponent's hand: Grizzly Bears and a couple of other cards. Your hand: Mind Rot.
- **Do:** In your main phase, activate Tinybones ({3}{B}, {T}). The opponent chooses a discard. Then
  cast Mind Rot on the opponent. Try to cast the exiled cards on your turn, then on the opponent's
  turn.
- **Check:** The activation is sorcery speed only. The opponent is asked which card to discard;
  check that their prompt is clear. Each discarded card triggers separately and goes into the
  opponent's exile pile with a stash counter (check that the counter shows in the zone viewer). On
  your turn the card can be cast off Swamps (any type, e.g. Bears needs green) as "Cast (impulse)".
  On the opponent's turn it can't be. Your own cards with stash counters can't be cast either way.
- **Known limits:** Exile-pile discoverability as for Gonti. The permission is Tinybones' static
  ability: it reaches cards an earlier Tinybones exiled, and lapses while no Tinybones is around
  (ruling).

### Kalamax, the Stormsire, Stella Lee, Wild Card

*Rules call* — cae13658

- **Setup:** Your precombat main, nothing cast yet this turn. Your battlefield: Kalamax, the
  Stormsire (TAPPED), Stella Lee, Wild Card (untapped, not summoning sick), lots of red mana. Your
  hand: four Shocks. Library top: any known card.
- **Do:** Cast Shock at the opponent (spell 1). Cast Shock (spell 2). Cast Shock (spell 3) and, with
  it on the stack, tap Stella Lee targeting it. Optionally, on another turn, untap Kalamax in
  response to its own trigger.
- **Check:** Spell 1: Kalamax copies it (first instant this turn, Kalamax tapped) with a
  choose-new-targets prompt, then gets a +1/+1 counter for copying an instant (the counter trigger
  resolves before the copy). Spell 2: no Kalamax copy (not your first instant, ruling: the whole
  turn counts). Stella's "second spell" trigger exiles your library's top card, which you may play
  until the end of your next turn: look for it in your exile pile with a Cast/Play button. Spell 3:
  Stella's ability can only be activated now (three spells cast). Its copy offers new targets and
  gives Kalamax a second counter. The opponent should end at 20 - 2x5 = 10 (three Shocks plus two
  copies). Kalamax untapped as its trigger resolves: no copy ("if Kalamax is tapped" is an
  intervening if, rule 603.4).
- **Known limits:** Spells cast before Stella entered still count toward "second" and "three or
  more" (ruling). That is correct.

### Fire Lord Azula, Alania, Divergent Storm

*Rules call* — cae13658 (whileCondition and trigger-spell-first)

- **Setup:** Azula: your turn. Your battlefield: Fire Lord Azula (not summoning sick). Your hand:
  Lightning Bolt x2. Opponent: a creature or two. Alania: a separate turn, precombat main, nothing
  cast yet. Your battlefield: Alania, Divergent Storm (or have it in hand to cast this turn), lots
  of U/R mana. Your hand: Shock x2, Divination, Kindlespark Duo x2. In a 3-4 player game for the
  target-opponent choice.
- **Do:** Azula: cast a Bolt precombat. Then attack with Azula, and with firebending's {R}{R} cast
  Bolt during combat (declare-attackers or blockers step), then another in the end-of-combat step.
  Alania: cast Shock, Shock, Divination, Kindlespark Duo, Kindlespark Duo in order, answering yes
  each time you're asked. Also try casting Alania herself first that turn, then Kindlespark Duo.
- **Check:** Azula: the precombat Bolt isn't copied. Bolts cast while Azula is attacking are copied
  with a choose-new-targets prompt. A creature stays attacking through the end-of-combat step (rule
  506.4), so that one should copy too. Firebending's {R}{R} lasts until end of combat (not emptied
  between combat steps). Alania: the trigger targets an opponent as it goes on the stack (with 3+
  players, check that you're asked which). Then comes a yes/no prompt, "Have target opponent draw a
  card to copy that spell?". Yes: that opponent draws, and you get a copy with new targets. Copies:
  the first Shock, Divination (first sorcery), the first Kindlespark Duo (the copy becomes a token).
  Not the second Shock or the second Duo. Alania's own cast doesn't count as the first Otter
  (ruling).
- **Known limits:** Azula's "while attacking" is asked only as the spell is cast (rule 603.1).
  Removing Azula from combat after that doesn't stop the copy (ruling, covered by tests).

### Imodane, the Pyrohammer

*Rules call* — cae13658 (what a spell targets in a deals-damage trigger; tests 6e6ce39c)

- **Setup:** Your main phase. Your battlefield: Imodane, the Pyrohammer, lots of red mana.
  Opponents' battlefields: two Grizzly Bears. Your hand: Lightning Bolt, Fireball, Shock. 2 or more
  opponents is best.
- **Do:** (a) Bolt one opponent's Bears. (b) Fireball with X=4 split between the two Bears. (c)
  Shock an opponent's face. (d) Bolt your own creature.
- **Check:** (a) Imodane deals 3 to each opponent: the damage the Bears was actually dealt, 3, not
  its 2 toughness. (b) Two different creatures targeted: no trigger. (c) A spell targeting a player:
  no trigger. (d) Any creature counts, yours included: 3 to each opponent. An opponent's spell never
  triggers it.
- **Known limits:** None documented.

### Reflections of Littjara, Volo, Guide to Monsters

*Rules call* — cae13658 (Reflections is a TDC precon card, stand-in removed)

- **Setup:** Your precombat main. Reflections: in hand with {4}{U} available. Hand also: Grizzly
  Bears x2, Changeling Outcast, Shock. Volo (separate board): Volo, Guide to Monsters on the
  battlefield, no Bears anywhere of yours. Hand: Grizzly Bears x2. Graveyard: empty at first,
  Changeling Outcast for the second check.
- **Do:** Reflections: cast it and choose Bear, then cast Grizzly Bears, Changeling Outcast and
  Shock. Volo: cast Grizzly Bears, then a second Grizzly Bears. Then put Changeling Outcast in your
  graveyard and cast another creature.
- **Check:** Reflections asks for a creature type as it enters: a searchable list of real creature
  types only, no card types (ruling). Bears is copied, and the copy becomes a token Grizzly Bears;
  both trigger and copy resolve before the original. Changeling Outcast is every type, so it is
  copied too. Shock isn't. Volo: the first Bears is copied into a token. Volo is a Human Wizard, so
  the type has to differ from Volo's. The second Bears isn't copied, because it shares Bear with the
  first. With Changeling Outcast in the graveyard, no creature spell with a creature type is copied
  (changeling shares every type).
- **Known limits:** The token a resolving copy becomes isn't "created". Create-token triggers
  shouldn't fire for it (rulings).

### Vizier of the Menagerie, Chromatic Orrery

*Rules call* — 1878f5ff + a1cb495f (cost:mana-spending-rules; the face-being-cast fix)

- **Setup:** Your precombat main. Board A: Vizier of the Menagerie, exactly 3 Mountains. Hand:
  Grizzly Bears, Glaring Fleshraker ({2}{C}), Divination. Board B: Vizier, 3 Forests, Murderous
  Rider in hand, an opponent creature. Board C: Chromatic Orrery (tapped), 3 Mountains. Hand:
  Divination, Painful Truths, Glaring Fleshraker. Add a Wastes later.
- **Do:** Look at which hand cards highlight as castable, then cast them.
- **Check:** A: Bears and Fleshraker are castable off Mountains (any type, so {C} too). Divination
  isn't (only creature spells, but from anywhere, ruling). B: only the creature face of Murderous
  Rider is offered. Swift End (an instant) isn't, because the face being cast is read (rule 715.3).
  Before a1cb495f, Swift End was offered and then failed. C: Orrery lets Mountains pay Divination's
  blue. Fleshraker's {C} pip is not payable by Mountains (any colour isn't colourless, rule 609.4b)
  until a Wastes is added. Painful Truths cast off 3 Mountains draws 1 and loses 1 life: converge
  counts the colours actually spent, only red.
- **Known limits:** Spending rules change how a cost is paid, never the cost: mana value, converge
  and "mana from a Treasure" still read the real mana spent (rule 609.4b).

### Grolnok, the Omnivore

*Rules call* — 1878f5ff + a1cb495f (playFromExile with croak counters)

- **Setup:** Your turn. Your battlefield: Grolnok, the Omnivore (not summoning sick; it is a Frog),
  lands to cast a Bears. Library from the top: Forest, Grizzly Bears, Lightning Bolt. Hand: Thought
  Scour, Unsummon. Land drop unused.
- **Do:** Attack with Grolnok. In postcombat main, open YOUR exile pile, play the Forest and cast
  the Bears from it. On another turn, cast Thought Scour on yourself. Then Unsummon Grolnok and
  check exile again.
- **Check:** The attack mills 3. Forest and Bears (permanent cards) each trigger separately and are
  exiled with a croak counter; Lightning Bolt stays in the graveyard. If asked to order the
  triggers, any order. Forest is played with your land drop ("Play land"), Bears cast at sorcery
  speed. Thought Scour's mill also triggers it (every permanent card from library to graveyard,
  ruling). With Grolnok gone, croak cards can't be played; they come back if Grolnok returns.
- **Known limits:** None documented.

### Haldan, Avid Arcanist, Pako, Arcane Retriever

*Rules call* — 1878f5ff + a1cb495f (playFromExile exiledByYou, spells filter, any-colour)

- **Setup:** Your turn. Your battlefield: Haldan, Avid Arcanist, Pako, Arcane Retriever (haste), 3
  Mountains, land drop unused. Your library top: Forest. Opponent's library top: Divination on one
  try, Murderous Rider on another, Grizzly Bears on a third.
- **Do:** Attack with Pako. In postcombat main, check both players' exile piles and play/cast what's
  offered.
- **Check:** Pako exiles every player's top card with a fetch counter and gets +1/+1 for each
  noncreature card. Divination can be cast from the opponent's exile pile off Mountains (any
  colour). Your own Forest can be played with your land drop. Grizzly Bears (a creature spell) can't
  be cast. Murderous Rider: only Swift End, the noncreature Adventure face, is offered (ruling),
  paid with Mountains. Cards exiled by someone else's fetch effect aren't yours to play. With Haldan
  gone, nothing is offered.
- **Known limits:** {C} pips still need colourless mana (any colour isn't colourless).

## Toxic, casualty, extra upkeeps and copy-on-enter (2026-10-03, first round)

### Cut Your Losses

*New decision* — 179c960c + 417505c0 (toxic, casualty, additional upkeep steps)

- **Setup:** 2-player, your precombat main. You: 6 Islands untapped, Grizzly Bears (2/2) and Memnite
  (1/1) on the battlefield, Cut Your Losses in hand. Opponent: a library of a known size, e.g.
  exactly 40 cards. Second run: the same board without the Bears (only Memnite).
- **Do:** Cast Cut Your Losses targeting the opponent. When the casualty banner appears, pick
  Grizzly Bears and Confirm. When the copy trigger resolves, keep the opponent as the copy's target
  (or try choosing a new target to see that prompt). Run it again and Confirm with nothing picked.
  Then run the Memnite-only board.
- **Check:** The banner reads 'Casualty 2 — you may sacrifice a creature with power 2 or greater to
  copy Cut Your Losses — 0/1 chosen'. Only the Bears is clickable, because Memnite's power is under
  2. Confirm works with 0 picked, so the cost is optional. When paid, the Bears goes to the
  graveyard and a 'Casualty 2 — copy Cut Your Losses. You may choose new targets for the copy.'
  trigger sits above the original. The copy resolves first. From 40 cards the copy mills 20, then
  the original mills half of what is left (10), for 30 in total, per the ruling. When declined,
  nothing is sacrificed, no copy is made and 20 are milled. With only Memnite there is no prompt at
  all. The copy is not cast, so 'whenever you cast' triggers do not see it.
- **Known limits:** The engine asks the casualty cost once the spell is already on the stack with
  its targets chosen, not during casting. Expect to see the spell on the stack before the banner
  appears. The result is the same as paying at rule 601.2h, and the sacrificed creature's own cast
  triggers are taken back (417505c0).

### Silverquill, the Disputant, Anhelo, the Painter

*New decision* — 179c960c + 417505c0

- **Setup:** 2-player, your precombat main. You: Silverquill, the Disputant (4/4), Anhelo, the
  Painter (1/3), two Young Pyromancer (2/1), Grizzly Bears, 3+ Mountains untapped. Hand: three
  Lightning Bolt. Opponent: Serra Angel (4/4), life 20, and an untapped land so the turn can pass to
  them.
- **Do:** (1) Cast Bolt at the opponent's face. Answer the two casualty prompts by sacrificing one
  Young Pyromancer and the Bears. When each copy trigger resolves, choose Serra Angel as the copy's
  new target. (2) Cast a second Bolt in the same turn. (3) Pass to the opponent's turn and cast the
  third Bolt there, then see who holds priority.
- **Check:** (1) There are two prompts, one per instance (rule 702.153b): 'Casualty 2' from Anhelo
  and 'Casualty 1' from Silverquill. The Casualty 2 prompt offers Bears, both Pyromancers and
  Silverquill, but not Anhelo (power 1). The Casualty 1 prompt also offers Anhelo and Silverquill
  itself. Two copy triggers go on the stack, each asking for new targets. With both aimed at the
  Angel it dies (6 damage) and the opponent goes to 17. The sacrificed Pyromancer makes no Elemental
  because it left before the spell became cast (rule 601.2i). The surviving Pyromancer makes exactly
  one, and the copies make none. (2) Only 'Casualty 1' is asked, because Anhelo covers only the
  first instant or sorcery each turn. (3) On the opponent's turn Anhelo's Casualty 2 is offered
  again, since it was your first that turn. Once you answer, priority comes back to you, the caster
  (rule 117.3c), not to the active player. Optional: cast a Bolt before Anhelo is on the
  battlefield, then cast Anhelo and a second Bolt. The second Bolt gets no Anhelo casualty, because
  spells cast before Anhelo arrived still count as 'the first'.
- **Known limits:** Same as Cut Your Losses: each prompt appears after the spell is already on the
  stack. The order of the two prompts is not specified.

### Venerated Rotpriest

*New decision* — 179c960c + 417505c0

- **Setup:** 3-player game (you, B, C). You: Venerated Rotpriest and Grizzly Bears, a Forest
  untapped, Giant Growth in hand. Player B: a Mountain untapped and Lightning Bolt in hand. On your
  turn, also have a land and an Equipment (e.g. Swiftfoot Boots, equip {1}) ready.
- **Do:** (1) On your turn, cast Giant Growth on your own Bears. (2) Have B cast Lightning Bolt at
  your Bears. (3) Equip Swiftfoot Boots to the Bears.
- **Check:** (1) Your own spell targeting your creature still triggers it, and you get a real
  'target opponent' choice between B and C; you are never offered. (2) B's Bolt triggers it, but the
  trigger is not auto-aimed at B: you may choose C (`targeterNotTarget`). That opponent's panel
  shows +1 poison. (3) The equip ability is an ability, not a spell, so no trigger. Optional: a
  single spell targeting two of your creatures triggers it twice.
- **Known limits:** In a 2-player game there is only one legal opponent, so the target may be filled
  in without a visible choice. Use 3+ players to see the prompt.

### Mockingbird, Deceptive Frostkite, Malleable Impostor, Glasspool Mimic // Glasspool Shore, Stunt Double

*New decision* — 40047fd3 + fe67fed2 (copy-on-enter options, legend-rule exemptions)

- **Setup:** 2-player, your precombat main. You: plenty of Islands, plus a Forest for Giant Growth.
  On your battlefield: Llanowar Elves (MV 1), Grizzly Bears (MV 2), Serra Angel (MV 5, power 4),
  Mulldrifter (MV 5). Opponent: Grizzly Bears and Wall of Denial. Hand: Mockingbird, Deceptive
  Frostkite, Malleable Impostor, Glasspool Mimic, Stunt Double, Giant Growth. Copy cards must start
  in hand: one put straight onto the battlefield by the scenario builder is never asked to copy.
- **Do:** Cast each copy card and read which permanents the 'click the permanent to copy' banner
  lets you click. Choose one. Cast Mockingbird with X = 2. Cast Giant Growth on your Bears before
  casting Frostkite. Cast Malleable Impostor at instant speed on the opponent's turn. Separately,
  play Glasspool Mimic as its land face, and decline a copy once with 'Copy nothing'.
- **Check:** Mockingbird (X = 2, so 3 mana spent; all mana counts, not only X): only creatures with
  MV ≤ 3 can be clicked, which are both Bears and the Elves, not the Angel or Mulldrifter. The copy
  is a Bird in addition and has flying. Deceptive Frostkite: only your creatures with power ≥ 4 at
  that moment, i.e. Serra Angel and the Giant-Grown Bears (5/5). A Bears copy is printed 2/2, now a
  Dragon with flying. Malleable Impostor: only the opponent's creatures; the copy is also a Faerie
  Shapeshifter and has flying. Glasspool Mimic: only your own creatures; the copy is also a
  Shapeshifter Rogue. Played as Glasspool Shore, nothing is asked and it enters tapped. Stunt Double
  (flash): any creature. Copying Mulldrifter fires its 'when this enters, draw two'. The tile shows
  the copied card's name with '(copy)', and the log says 'X enters as a copy of Y'. 'Copy nothing'
  leaves Stunt Double a 0/0 that dies; Mockingbird stays a 1/1 flyer.
- **Known limits:** A token copy of a Clone-type card is never asked its copy choice (BACKLOG,
  AUTHORING §15). Neither is a card placed directly onto the battlefield by a debug or scenario
  spawn, so always cast these, or reanimate or blink them.

### Phyrexian Metamorph, Clever Impersonator, Sculpting Steel, Copy Artifact, Masterwork of Ingenuity, Vesuva

*New decision* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. You: plenty of Islands. On your battlefield: Sol Ring,
  Swiftfoot Boots attached to your Grizzly Bears, Phyrexian Arena, a Forest. Opponent: Nissa, Who
  Shakes the World with its loyalty reduced to 2, a Mountain, a creature. Hand: Phyrexian Metamorph,
  Clever Impersonator, Sculpting Steel, Copy Artifact, Masterwork of Ingenuity, Vesuva (with your
  land drop unused).
- **Do:** Cast each card and read the clickable options. Pay Metamorph's {U/P} with 2 life once.
  Copy Sol Ring with Metamorph. Copy the opponent's Nissa with Clever Impersonator. Copy Swiftfoot
  Boots with Masterwork. Play Vesuva and copy the opponent's Mountain, then repeat with 'Copy
  nothing'.
- **Check:** The banner says 'click the permanent to copy', and noncreatures can be clicked.
  Metamorph offers artifacts and creatures, both players'. As a Sol Ring copy it is a noncreature
  artifact: it does not die as a 0/0 and it taps for {C}{C}. Clever Impersonator offers every
  nonland permanent, opponent's included. As Nissa it enters with the printed 5 loyalty, not the
  copied Nissa's current 2. Sculpting Steel offers only Sol Ring and the Boots, not Arena or Bears.
  Copy Artifact is an artifact enchantment, colorless (not blue). Masterwork of Ingenuity as
  Swiftfoot Boots enters unattached and has equip {1}. Vesuva offers every land on the battlefield,
  both sides, and enters tapped as a Mountain. Declined, it enters untapped as Vesuva with no mana
  ability (its ruling).
- **Known limits:** As above: cast or play these from hand. A spawned or scenario-placed one is not
  asked.

### Copy Enchantment, Mirrormade

*New decision* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. Opponent: Grizzly Bears enchanted by your Pacifism, and
  Slippery Bogle (hexproof). You: Sol Ring and Islands. Hand: Copy Enchantment and Mirrormade.
- **Do:** Cast Copy Enchantment and choose Pacifism as the thing to copy. At the second prompt,
  choose Slippery Bogle as the creature to enchant. Then cast Mirrormade and look at its options.
- **Check:** Two prompts come in a row. First comes the copy choice; Copy Enchantment can click only
  enchantments (Pacifism), while Mirrormade can click Pacifism and Sol Ring. Then comes 'choose what
  an Aura enchants'. Hexproof Slippery Bogle can be chosen, because attaching this way does not
  target (its ruling), but the entering Aura itself cannot. The copy enters already attached, and
  the Bogle can't attack or block. If nothing could be enchanted, the Aura copy would not enter at
  all (rule 303.4g).

### Estrid's Invocation, Altered Ego

*New decision* — 40047fd3 + fe67fed2

- **Setup:** 2-player. You: Phyrexian Arena on the battlefield, Islands, Forests. Hand: Estrid's
  Invocation and Altered Ego. Opponent: a Counterspell available (2 Islands) to try on the Ego, plus
  some creature (e.g. Grizzly Bears). For a bonus, combine with the Obeka entry for repeated
  upkeeps.
- **Do:** Cast Estrid's Invocation copying Phyrexian Arena. At your next upkeep, answer the trigger
  order, then accept the Invocation's 'exile and return' prompt. Choose 'Copy nothing' on the
  return. Separately, cast Altered Ego with X = 2 copying the Bears, let the opponent try to counter
  it, then cast another with 'Copy nothing'.
- **Check:** Estrid's Invocation offers only enchantments you control. As Arena it is an Arena with
  the extra upkeep ability, so the upkeep brings two Arena triggers plus the Invocation's yes/no
  prompt. Accepting it exiles and returns the Invocation as a new object, which asks the copy choice
  again. Choosing nothing leaves a plain Estrid's Invocation without the upkeep ability; it cannot
  copy itself to get it (its ruling). Altered Ego cannot be countered: Counterspell is not offered
  it as a legal target, or it does nothing. It enters as a Bears copy with 2 additional +1/+1
  counters (4/4). Declined, it gets no counters and dies as a 0/0 (its ruling).

### Ghalta and Mavren, Auton Soldier

*New decision* — 40047fd3 + fe67fed2

- **Setup:** 3-player game (you, B, C), your precombat main. You, with none summoning sick: Ghalta
  and Mavren, Serra Angel, Grizzly Bears. Have Swords to Plowshares and a Plains in hand. For Auton
  Soldier, a separate run: Krenko, Mob Boss on your battlefield, Auton Soldier in hand with 6
  Islands, and a turn later to attack.
- **Do:** Attack with all three. When the 'choose one' trigger appears, pick the Dinosaur mode. With
  it on the stack, Swords your own Serra Angel. When the token enters, choose player C as the player
  it attacks. In another combat pick the Vampire mode. Auton Soldier run: cast it copying Krenko,
  then attack B with it next turn.
- **Check:** The mode is chosen as the trigger goes on the stack. X is read on resolution (its
  ruling), so with the Angel exiled the Dinosaur is 2/2 (Bears' power), not 4/4. It enters tapped
  and attacking, and you are asked which player or planeswalker it attacks (enter-attacking prompt);
  it may differ from what Ghalta attacked. Nothing that triggers on attackers being declared sees
  it. With the Vampire mode you get one 1/1 lifelink Vampire per other attacker, and they are not
  attacking. Attacking alone with the Dinosaur mode makes a 0/0 that dies at once. Auton Soldier as
  Krenko is a nonlegendary artifact Krenko with myriad, and both Krenkos stay. On the attack you get
  a myriad 'create a token copy attacking this player?' prompt for C only. The token is also a
  nonlegendary artifact Krenko and is exiled at end of combat.

### Karumonix, the Rat King, Blightbelly Rat, Bilious Skulldweller

*Rules call* — 179c960c + 417505c0

- **Setup:** 2-player, your precombat main. You: 3 Swamps untapped, Karumonix in hand. Already on
  the battlefield and not summoning sick: Blightbelly Rat (2/2, toxic 1) and Bilious Skulldweller
  (1/1 deathtouch, toxic 1, an Insect). Library top five, top first: Island, Blightbelly Rat,
  Bilious Skulldweller, Island, Blightbelly Rat. Opponent: one Grizzly Bears untapped, 0 poison.
- **Do:** Cast Karumonix and resolve its enters trigger. Then attack with Blightbelly Rat and
  Bilious Skulldweller, and have the opponent block the Skulldweller with the Bears. Later, let a
  Blightbelly Rat die (for example, block it with something bigger) while the opponent has poison.
- **Check:** The look-at-top-five prompt offers only the two Blightbelly Rat cards; the Skulldweller
  is an Insect and the Islands are not Rats. Any number can be taken, including 0. The unchosen
  cards go to the bottom in random order. In combat the unblocked Rat deals 2 damage and gives 2
  poison: its own toxic 1 plus the toxic 1 Karumonix grants, which add up (rule 702.164b). The
  blocked Skulldweller gives no poison, because damage to a creature never does. The player panel
  shows the poison count, e.g. '2/10'. When a Blightbelly Rat dies, its proliferate prompt appears,
  and choosing the opponent adds 1 poison.
- **Known limits:** BACKLOG: a creature's total toxic value is not in the player view. The Rat's
  tile and text show only its printed 'Toxic 1' and nothing for the grant from Karumonix. The poison
  actually given (2) is the thing to check.

### Bloated Contaminator, Contaminant Grafter, Tyrranax Rex

*Rules call* — 179c960c + 417505c0

- **Setup:** 2-player, your precombat main. You: Bloated Contaminator (4/4 trample, toxic 1) and
  Contaminant Grafter (5/5 trample, toxic 1), neither summoning sick. Put a basic land in your hand
  for the end-step part. Opponent: 1 poison counter, one untapped Grizzly Bears.
- **Do:** Attack with both. The opponent blocks the Grafter with the Bears. Assign 2 to the Bears
  and 3 trample damage to the player. Resolve both proliferate triggers, choosing the opponent each
  time. Then go to your end step.
- **Check:** Toxic: both creatures dealt combat damage to the player (trample damage counts), so the
  opponent gets +1 and +1 poison, going from 1 to 3. Toxic adds poison on top of the damage, and the
  life loss still happens. Two triggers follow: Bloated Contaminator's proliferate, and Grafter's
  'one or more creatures … one or more players' proliferate, which fires once for the damage event,
  not once per creature. You get the trigger-order prompt, and two proliferate prompts take the
  opponent to 5. At your end step, Grafter's corrupted trigger fires because an opponent has ≥3
  poison: you draw a card, then get an optional prompt to put a land card from your hand onto the
  battlefield, which you can decline. With the opponent under 3 poison it does not trigger.
  Optional: Tyrranax Rex (toxic 4) dealing combat damage gives exactly 4 poison however much damage
  it deals.
- **Known limits:** The granted-toxic display gap (BACKLOG) does not affect these, since their toxic
  is printed.

### Bloodroot Apothecary

*Rules call* — 179c960c + 417505c0

- **Setup:** 3-player game if possible, otherwise 2-player. You: 3 Forests untapped, Bloodroot
  Apothecary in hand. An opponent should be able to spend mana on something (any card in hand) so
  they will sacrifice a Treasure. It helps to control that opponent's seat yourself. Optionally,
  give that opponent a creature token (e.g. a Soldier token) and a sacrifice outlet such as Viscera
  Seer.
- **Do:** Cast the Apothecary. Choose the target opponent for its enters trigger. Then have that
  opponent sacrifice their Treasure for mana. Sacrifice your own Treasure for mana. Have the
  opponent sacrifice a creature token.
- **Check:** The enters trigger asks for a target opponent. You and that opponent each get one
  Treasure, made together. When the opponent sacrifices their Treasure (a noncreature token), even
  as a mana ability while paying for a spell, they get 2 poison afterwards. Your own Treasure gives
  nothing ('an opponent'). Their sacrificed creature token gives nothing ('noncreature'). In combat,
  Apothecary's toxic 2 gives 2 poison.
- **Known limits:** Per the ruling, if the target opponent is an illegal target on resolution, no
  one gets a Treasure. That is hard to set up live and is covered by the card's definition.

### White Sun's Twilight, Mirrex, Phyrexian Mite token

*Rules call* — 179c960c + 417505c0

- **Setup:** 2-player, your precombat main. You: Mirrex in hand (not yet played) and 7 other lands
  untapped. Already on the battlefield: an existing Phyrexian Mite token (from Mirrex on an earlier
  turn, or placed) and Grizzly Bears. Opponent: Serra Angel. Hand: White Sun's Twilight.
- **Do:** Play Mirrex and look at its mana abilities, then cast White Sun's Twilight with X = 5.
  Next turn, check Mirrex's abilities again and activate {3},{T} for a Mite. Repeat the cast with X
  = 4 on a fresh board. When the opponent attacks, try to block with a Mite.
- **Check:** Mirrex offers 'Add one mana of any color' only on the turn it entered; on later turns
  it offers only {C}. With X = 5 you gain 5 life and get five new Mites. 'Destroy all other
  creatures' kills the Bears, the Angel and the older Mite, but none of the five new Mites. The new
  Mites must not have joined the old Mite's stack and been spared with it. With X = 4 nothing is
  destroyed. Mites cannot be declared as blockers, so the block UI should not offer them. A Mite
  dealing combat damage to a player gives 1 poison.

### Obeka, Splitter of Seconds

*Rules call* — 179c960c + 417505c0

- **Setup:** 2-player, your turn 1 precombat main, or any of your turns. You: Obeka (2/5 menace, not
  summoning sick), Phyrexian Arena, a Mountain untapped, Rift Bolt in hand. Optionally add Giant
  Growth with a Forest. Opponent: at most one creature, so menace makes Obeka unblockable. Turn on a
  stop at your upkeep if you use stops.
- **Do:** In main phase 1, suspend Rift Bolt for {R} (one time counter). Attack with Obeka, and
  optionally Giant Growth it after blockers. Let combat damage and the trigger resolve, then step
  through to the second main phase.
- **Check:** Obeka deals 2 and its trigger gives 2 additional upkeep steps after this combat phase.
  After end of combat the phase track goes to UP twice, then to M2. There is no untap step and no
  draw step (rule 500.11 and the rulings), and the turn number does not change. Phyrexian Arena
  triggers in each extra upkeep: +2 cards and -2 life in total. In the first extra upkeep, Rift
  Bolt's last time counter comes off and you are prompted to choose a target for its free cast (3
  damage). With Giant Growth, 5 damage gives 5 upkeeps. If something adds an extra combat during end
  of combat, that combat comes before the upkeeps (rule 500.8).
- **Known limits:** The client view carries no 'additional phase' marker (`turn.addedUpkeep` is
  engine-only), so the phase track simply lights UP between EC and M2. Judge whether that reads
  clearly; it is not a rules bug. The effect adds phases only after a combat phase, and only on its
  controller's turn (rule 500.10a).

### Sakashima of a Thousand Faces, Spark Double, Clone (for comparison)

*Rules call* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. You: plenty of Islands. On your battlefield: Krenko, Mob
  Boss, and your own Nissa, Who Shakes the World. Opponent: Grizzly Bears, plus Lightning Bolt and a
  Mountain (or you hold the removal). Hand: two Spark Double, Clone, Sakashima of a Thousand Faces.
  Optionally add Doubling Season.
- **Do:** (1) Cast a Spark Double copying Krenko, and the other copying Nissa. (2) Cast Clone
  copying Krenko. (3) Restart, or remove the extra Krenko, then cast Sakashima, copy Krenko, and
  cast Clone copying Krenko again. (4) Remove (Bolt) the Sakashima.
- **Check:** (1) Spark Double as Krenko is not legendary and enters with one +1/+1 counter (4/3).
  Both stay, with no legend prompt. Spark Double as Nissa has 6 loyalty (printed 5 + 1), is not
  legendary, and both Nissas stay. With Doubling Season the creature version gets 2 counters. (2)
  Clone as Krenko is legendary, so the legend rule prompt 'choose which legend to keep' appears,
  with a 'Keep the oldest' button. (3) Sakashima's copy options are only your other creatures: not
  itself, not the opponent's Bears. As Krenko it is legendary but has 'the legend rule doesn't apply
  to permanents you control'. You then keep three Krenkos with no prompt, the Clone included, since
  a copy of Sakashima-as-Krenko has the ability too. (4) The moment Sakashima leaves, the legend
  rule applies again. You are immediately prompted to keep one of the remaining Krenkos, with no
  window to respond (rule 704.5j, its ruling).
- **Known limits:** The partner part of Sakashima is deck construction only and is not part of the
  copy exception.

### Sakashima the Impostor

*Rules call* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. You: 10+ Islands. On your battlefield: Grizzly Bears and
  Serra Angel. Hand: two Sakashima the Impostor.
- **Do:** Cast the first Sakashima copying the Bears and activate its {2}{U}{U} ability. Before the
  end step, cast the second one copying Serra Angel. Optionally, in another run, activate the
  ability and then blink or bounce-and-recast it before the end step.
- **Check:** The first enters as a 2/2 named 'Sakashima the Impostor' (the tile shows that name with
  '(copy)' and the Bears art). It is legendary and has the {2}{U}{U} ability. Activated, a delayed
  trigger returns it to your hand at the beginning of the next end step. The second copies a
  different creature but has the same name, so both are legendary 'Sakashima the Impostor' and the
  legend rule prompt appears (rule 704.5j reads names, not what they copy). If it left and came back
  after the activation, the delayed trigger does nothing (rule 400.7, its ruling). Declining the
  copy leaves a plain 3/1 Human Rogue with no return ability.
- **Known limits:** The two-Impostors legend-rule case is not covered by a dedicated test. Expected
  per rule 704.5j and AUTHORING (the legend rule reads `nameOf`).

### Phantasmal Image, Clone (for comparison)

*Rules call* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. You: Serra Angel, Swiftfoot Boots (unattached), Islands
  and a Forest. Hand: Phantasmal Image, Clone, Giant Growth. Opponent: Lightning Bolt and a
  Mountain.
- **Do:** Cast Phantasmal Image copying Serra Angel. Cast Clone copying the Image. Then try to equip
  Swiftfoot Boots to the Image, and separately Giant Growth the Clone.
- **Check:** The Image is a 4/4 flying Angel Illusion. The Clone of the Image is also an Illusion
  with the sacrifice trigger, because both are copiable values (rule 707.9a). When the equip ability
  targets the Image (an ability, not only spells), its 'becomes the target … sacrifice it' trigger
  fires and the Image is sacrificed; the equip then fizzles. Giant Growth on the Clone sacrifices
  the Clone, not the Image. An opponent's Bolt aimed at it gets the same result. Declining the copy
  leaves a 0/0 Illusion with no trigger, which dies.

### Cursed Mirror

*Rules call* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. You: 3 Mountains and 4 Islands. Hand: Cursed Mirror and
  Clone. Opponent: Serra Angel and no other blockers.
- **Do:** Cast Cursed Mirror and copy the opponent's Serra Angel. Look at its abilities, then attack
  with it this turn. Cast Clone copying the Mirror. Pass the turn and check both on the next turn.
- **Check:** As it enters, the Mirror becomes a 4/4 flying, vigilance Angel with haste and can
  attack the turn it arrived. While it is a copy it has no '{T}: Add {R}' (its ruling). In the
  cleanup step it becomes Cursed Mirror again: an artifact that taps for {R}, no longer a creature.
  The Clone copied it meanwhile, so the Clone stays a Serra Angel with haste after the cleanup,
  because the duration is not copiable (its ruling).

### Aeve, Progenitor Ooze

*Rules call* — 40047fd3 + fe67fed2

- **Setup:** 2-player, your precombat main. You: 5 Forests, 2 Mountains, 4 Islands. Hand: two
  Lightning Bolt, Aeve, Clone. Battlefield: no Oozes.
- **Do:** Cast both Bolts, then cast Aeve, which gives a storm trigger with two copies. Resolve
  everything. Then cast Clone copying one of the Aeve tokens.
- **Check:** The storm copies resolve one at a time before the original. The first token enters with
  0 counters (2/2), the second with 1 (3/3), and the card Aeve with 2 (4/4): each counts the Oozes
  already there, never itself (rulings). The tokens are not legendary, so there is no legend-rule
  prompt with three Aeves on board. The card Aeve is legendary. A Clone copying an Aeve token is not
  a token, so it is legendary, and the legend rule prompt appears for it and the card Aeve (rule
  704.5j).
- **Known limits:** The Clone-of-a-token case is not covered by a dedicated test (the test clones
  the card Aeve). Expected per the `notLegendaryIfToken` static.

### Prime Speaker Zegana, Tangleweave Armor

*Rules call* — 40047fd3 + fe67fed2

- **Setup:** Zegana: 2-player, your main. You: Grizzly Bears (2/2), 6 lands (GGUU+), Zegana in hand,
  Lightning Bolt and a Mountain. Opponent: Serra Angel (power 4). Tangleweave Armor: a Commander
  game where your commander is Krenko, Mob Boss (MV 4) sitting in the command zone, with 4 Forests +
  4 more lands, Tangleweave Armor in hand, and a Grizzly Bears.
- **Do:** Cast Zegana. With its draw trigger on the stack, Bolt Zegana. Commander run: cast
  Tangleweave Armor, then pay equip {4} to move it to the Bears.
- **Check:** Zegana enters with 2 +1/+1 counters: the greatest power among your other creatures, not
  the opponent's Angel (4) and not itself. It is a 3/3, the Bolt kills it, and the draw still draws
  3, using its power as it last existed (its ruling). Tangleweave Armor's Germ is a 4/4 even though
  Krenko is in the command zone ('wherever they are', its ruling). Equipped to the Bears it gives
  +4/+4 (6/6), and the unequipped 0/0 Germ dies. With no commander, X is 0 and the Germ dies at
  once.

## Sacrifice costs and the Tarkir precons' one-offs (2026-10-03, second round)

### Sai, Master Thopterist, Ornithopter, Treasure Token

*New decision* — abdcce91 + deb1f3be (sacrifice costs of several permanents)

- **Setup:** Your turn, main phase. You: Sai, Master Thopterist, 2 untapped Islands, Sol Ring, 3
  Treasure tokens. Hand: Ornithopter. For the token-stack check, also have 10+ Thopter tokens,
  enough to show as one stacked tile.
- **Do:** (1) Cast Ornithopter: Sai triggers. (2) Activate Sai's '{1}{U}, Sacrifice two artifacts'
  and pick 2 in the sacrifice prompt. (3) With the Thopter stack, click the stacked tile in the
  sacrifice prompt and take 2 from it with the count menu. (4) Edge case on a fresh board: only 1
  Island and 2 Treasures as artifacts, then add a 3rd Treasure.
- **Check:** (1) A 1/1 flying Thopter token appears and the trigger resolves before Ornithopter. (2)
  The mana is paid first, the ability goes on the stack, and only then does 'Sai, Master Thopterist:
  Sacrifice 2 - 0/2 chosen' appear. Sai isn't eligible (not an artifact). Confirm stays disabled
  until exactly 2 are chosen, both leave together, priority returns to you with the ability on the
  stack, and you draw 1 on resolution. (3) The stack count drops by exactly 2; the rest stay. (4)
  With 1 Island and 2 Treasures the ability isn't offered: the {1} has to come from a Treasure,
  which then can't also be sacrificed (601.2g/h). The 3rd Treasure makes it offered, and all of them
  go with no prompt.
- **Known limits:** The sacrifice prompt has no Cancel by design: the mana is already paid (601.2h).
  Exactly enough eligible permanents means no prompt; they're all taken.

### Jarad, Golgari Lich Lord, Metalwork Colossus, Overgrown Tomb

*New decision* — abdcce91 + deb1f3be (sacrifice costs of several permanents)

- **Setup:** Jarad, return from the graveyard: Jarad in your graveyard; on your battlefield 2
  Overgrown Tombs and 1 Forest. Variant: a single Overgrown Tomb plus a Swamp. Jarad's drain: Jarad
  on the battlefield, Grizzly Bears and Hill Giant in your graveyard, Hill Giant on the battlefield,
  {1}{B}{G} open, Giant Growth in hand. Metalwork Colossus: Colossus in hand and another in the
  graveyard; Sol Ring, Mind Stone and Ornithopter on the battlefield, plus 6 Wastes.
- **Do:** Activate Jarad's 'Sacrifice a Swamp and a Forest' from the graveyard. Pump Hill Giant with
  Giant Growth, then sacrifice it to Jarad's drain. Check whether Metalwork Colossus in hand is
  castable, then activate the graveyard Colossus's 'Sacrifice two artifacts'.
- **Check:** Jarad asks twice, one 'Sacrifice 1' per land type. The first offers only the two Tombs
  (the Forest can't be the Swamp); the second offers the other Tomb or the Forest. Watch whether the
  prompt makes clear which land type it wants: it says 'Sacrifice 1' and relies on the highlighting.
  A lone Overgrown Tomb can't pay both halves (ruling). Tomb plus Swamp goes through with no prompt.
  Jarad returns to hand. On the battlefield Jarad is 4/4 with 2 creature cards in the graveyard. The
  drain uses the sacrificed creature's last-known power: 6 with Giant Growth. Colossus costs {11}
  minus 3 (Sol Ring 1 + Mind Stone 2; the creature Ornithopter doesn't count). Its graveyard ability
  returns it to hand.

### Priest of Forgotten Gods

*New decision* — abdcce91 + deb1f3be (sacrifice costs of several permanents; APNAP fix)

- **Setup:** Use a 3- or 4-player game. You: Priest of Forgotten Gods (untapped, not
  summoning-sick), plus 3 other creatures (e.g. Grizzly Bears, Hill Giant, Serra Angel). Each
  opponent: 2 creatures. One opponent with no creatures. Ideally on an opponent's turn, to see that
  it works at instant speed and that the choosing order follows turn order.
- **Do:** Activate Priest. Target opponents out of turn order (the later one first), then try
  another activation with zero targets. Choose 2 creatures to sacrifice.
- **Check:** Priest itself is never offered for the sacrifice. 'Done' with no targets is allowed,
  and you still get {B}{B} and draw (ruling). It uses the stack even with no targets (not a mana
  ability). Each targeted player loses 2. Each chooses their own creature to sacrifice, starting
  with the active player and then in turn order, whatever order you targeted them in (rule 101.4). A
  targeted player with no creature still loses 2. {B}{B} shows in your pool, which empties at the
  end of the step. If you target yourself, you lose 2 and choose a sacrifice too.
- **Known limits:** Against bots, you'll only see the opponents' choices land in the log and on the
  board.

### Grim Hireling, Magda, Brazen Outlaw, Axgard Cavalry, Shivan Dragon

*New decision* — abdcce91 + deb1f3be (sacrifice costs of several permanents, 'Sacrifice X')

- **Setup:** Grim Hireling: your main phase. Grim Hireling on the battlefield, 1 Swamp, 3 Treasure
  tokens; opponent has Hill Giant (3/3). Variant: no Swamp. Magda: Magda and Axgard Cavalry on the
  battlefield, 4 Treasures, Shivan Dragon and some non-artifact cards in your library.
- **Do:** Grim Hireling: activate, choose X in the X prompt, target Hill Giant, then pick X
  Treasures. Try X=0 too. Attack with two creatures and let both connect. Magda: tap Magda with
  Axgard Cavalry's ability (or attack with Dwarves), then with 5 Treasures activate 'Sacrifice five
  Treasures'.
- **Check:** Hireling: max X is 3 with the Swamp and 2 without, because the {B} must come from a
  Treasure that then can't be sacrificed (601.2g). X is announced though the mana cost has no X
  (107.3a). X=2 makes Hill Giant 1/1. X=0 sacrifices nothing, with no prompt. Sorcery speed only.
  Two creatures connecting give exactly 2 Treasures once, not 4. Magda: Axgard Cavalry is 3/2
  (+1/+0) and Magda isn't pumped. A Dwarf becoming tapped makes a Treasure. The search ability is
  offered only with 5+ Treasures, takes exactly 5 with no prompt, and the library search offers only
  artifacts and Dragons. Shivan Dragon goes onto the battlefield and the library is shuffled.

### Ruthless Technomancer

*New decision* — abdcce91 + deb1f3be (sacrifice costs of several permanents, 'X can't be 0')

- **Setup:** Your main phase. You: 4+ Swamps; Hill Giant and Grizzly Bears on the battlefield; Giant
  Growth in hand; Ruthless Technomancer in hand. Your graveyard: Grizzly Bears (power 2), Hill Giant
  (power 3), Ornithopter (power 0).
- **Do:** Pump Hill Giant with Giant Growth, then cast Technomancer. Answer Yes to its 'may' and
  sacrifice Hill Giant. Next, with 3 open Swamps and the Treasures, open Technomancer's ability
  menu.
- **Check:** The ETB prompt reads roughly 'Sacrifice another creature to create Treasures equal to
  its power? Yes/No'. No does nothing. Technomancer itself isn't offered. You get Treasures equal to
  the sacrificed creature's last-known power: 6 for a Giant Growth-pumped Hill Giant. The ability: X
  can't be 0. The engine offers it once per X (one offer each for X=1, 2, ...), and each X offers
  only creature cards with power <= X (at X=2: Bears and Ornithopter, not Hill Giant). Then you pick
  X artifacts to sacrifice.
- **Known limits:** Possible client issue, found in the code but not seen live. The ability menu
  labels each offer with the ability's text only, and its React key is abilityIndex plus mana
  colours, so the X=1 and X=2 offers may show as identical rows (and duplicate keys) with nothing
  saying which X is which. Check whether you can tell them apart.

### Stormshriek Feral, Flush Out, Marang River Regent, Coil and Catch, Whirlwing Stormbrood, Dynamic Soar, Bloomvine Regent, Claim Territory, Twincast, Counterspell, Run Away Together

*New decision* — 7753c2e8 + 2840ba65 + d0ed97e2 (Omen)

- **Setup:** Your turn, main phase, plenty of R/U/G mana. Hand: Stormshriek Feral, Marang River
  Regent, Whirlwing Stormbrood, Bloomvine Regent, Twincast, Counterspell, Run Away Together, plus
  one spare card. Library: at least 2 basic Forests. A creature of yours on the battlefield (Grizzly
  Bears) and one of the opponent's.
- **Do:** (1) Click each omen card in hand and look at the cast options. (2) Cast Flush Out, discard
  a card. Then cast Flush Out again with an empty hand (put another Stormshriek in hand alone). (3)
  Cast Coil and Catch, Twincast it, and let both resolve. (4) Cast Flush Out and counter it with
  your own Counterspell. (5) Cast Dynamic Soar on your Bears, then respond with Run Away Together on
  your Bears and an opposing creature. (6) Cast Claim Territory. (7) Open the Library page for
  Bloomvine Regent.
- **Check:** (1) Each card offers both halves; as an Omen it's cast with the Omen's own cost and
  colour (d0ed97e2: Dynamic Soar is green, {2}{G}). (2) Discard 1, draw 2. Flush Out is shuffled
  into your library (720.3d): not in the graveyard, and the log shows a shuffle. With an empty hand
  it draws nothing ('if you do'). (3) The copy draws 3 and discards 1, then ceases to exist, and
  your library is still shuffled (ruling, fixed in 2840ba65). The original then resolves and is
  shuffled in. (4) A countered Omen goes to the GRAVEYARD. (5) A fizzled Omen goes to the graveyard;
  Run Away Together returns both creatures. (6) Up to 2 basic Forests: one onto the battlefield
  tapped, one to hand, then shuffle (with the Omen card itself). (7) The Library shows the Omen
  under an 'Omen' divider, not flippable, with an 'omen' chip.

### Glorybringer, Combat Celebrant, Stormbreath Dragon

*New decision* — 7753c2e8 (exert as it attacks)

- **Setup:** Your turn, precombat main. You: Glorybringer, Combat Celebrant and Grizzly Bears, all
  untapped and not summoning-sick. Opponent: Grizzly Bears, Hill Giant and Stormbreath Dragon (a
  Dragon). Variant: the opponent has only Stormbreath Dragon.
- **Do:** Declare all three as attackers. Answer the exert questions. In the second combat, attack
  again with Glorybringer and the Bears. Play through to your next two turns.
- **Check:** After attackers are declared and before blockers, you get one question per
  exert-capable attacker, e.g. 'Glorybringer - Exert Glorybringer as it attacks (it won't untap
  during your next untap step) [Yes] [No]' (508.1g, 701.43). Glorybringer's 'when you do' offers
  only opponents' non-Dragon creatures (Bears, Giant; not Stormbreath, nothing of yours) and deals
  4. With one legal target it's chosen for you. With only a Dragon available you can still exert;
  the trigger just doesn't happen (ruling). Celebrant's exert untaps all your OTHER creatures, which
  stay attacking, and adds a second combat right after this one with no main phase between. In
  combat 2 the Celebrant isn't asked again ('if it hasn't been exerted this turn'), but Glorybringer
  IS (it has no such clause), so it can deal 4 again. Your next untap step: exerted creatures stay
  tapped. The turn after, they untap. The log reads 'Alice exerts Glorybringer'.
- **Known limits:** Neither GameObject.exertedBy nor 'monstrous' reaches the client, so no tile
  badge shows a creature is exerted; only the log does. Opponents waiting on you see the generic
  'choose a mode' label.

### Skarrgan Hellkite

*New decision* — 7753c2e8 (riot; an activated ability's divided damage)

- **Setup:** Your main phase. You: 9+ red sources; Skarrgan Hellkite in hand. Opponent: two Grizzly
  Bears. Run it twice.
- **Do:** Cast Skarrgan Hellkite. Run 1: pick 'Haste' at the riot question. Run 2: pick '+1/+1
  counter', then activate '{3}{R}: 2 damage divided among one or two targets', once with one target
  and once with two (one Bears plus the opponent). For the two-target activation, bounce or kill one
  target in response if you can.
- **Check:** Riot asks before the Hellkite enters, as 'Skarrgan Hellkite - choose one [+1/+1
  counter] [Haste]', with no window to respond (702.136a). Haste is permanent: still there next
  turn. Without a counter the damage ability isn't activatable. With the counter it's 5/5 with no
  haste. One target takes 2 automatically. Two targets open the division step 'Divide 2 damage',
  forced to 1/1 (at least 1 each, 601.2d), chosen as you activate, not on resolution (ruling). If
  one of two targets becomes illegal, the other still takes only 1 (ruling).
- **Known limits:** AUTHORING section 15: riot granted by a static (Rhythm of the Wild) isn't
  supported, and a token copy of a riot creature isn't asked and simply gets haste. Client wording:
  opponents see 'choose a creature type' while you answer riot (it reuses that menu). The division
  step's confirm button says 'Cast' even for an ability.

### Dragonlord Atarka, Inferno Titan

*New decision* — 7753c2e8 (a triggered ability's divided damage)

- **Setup:** Your main phase. You: 7 lands including R and G; Dragonlord Atarka in hand; Inferno
  Titan on the battlefield, not summoning-sick. Opponent: Grizzly Bears and Hill Giant (and a
  planeswalker if you have one). Also a creature of your own. In 3+ players, give a second opponent
  a creature too.
- **Do:** Cast Atarka and answer its enters trigger: choose targets, then divide 5. Later, attack
  with Inferno Titan and divide 3 among 1 to 3 targets, including a player. Also press Cancel once
  in the division step.
- **Check:** Atarka offers only creatures and planeswalkers your opponents control, any opponent's:
  not yours, not players. After the targets comes the division step, at least 1 each with a total of
  exactly 5. 2/3 kills both; a lopsided 4/1 puts the damage where you assigned it. One target gets
  all 5 automatically. A target that becomes illegal in response loses its share (ruling). Inferno
  Titan's attack trigger needs 1 to 3 targets of any kind (your own included), with 3 split 1/1/1,
  2/1 or 3. Cancel: a trigger's targets are mandatory, so Cancel should return you to target choice,
  not leave the decision stuck or skip it.
- **Known limits:** Division of an X total (Fire Covenant) and distributing counters (Lathiel)
  aren't built (BACKLOG). The confirm button reads 'Cast' even for a trigger.

### Kotis, Sibsig Champion, River Kelpie, Stormshriek Feral

*New decision* — 7753c2e8 (graveyard permission that exiles three other cards)

- **Setup:** Your turn, main phase. You: Kotis, River Kelpie and mana on the battlefield. Your
  graveyard: Grizzly Bears, Hill Giant, Stormshriek Feral and 4 other cards (lands).
- **Do:** Open your graveyard and cast Grizzly Bears through Kotis, choosing 3 other cards to exile.
  Then look at what else is castable from the graveyard this turn. On another board, try it with
  only 2 other cards in the graveyard, and on an opponent's turn.
- **Check:** The graveyard offers 'Cast' (not 'Escape'). The picker reads 'Cast Grizzly Bears -
  choose 3 other cards to exile' and never offers the Bears itself. The three go to exile as it's
  cast. Kelpie draws 1 for a spell cast from a graveyard, but NOT for the Bears entering: it entered
  from the stack (Kelpie ruling). Kotis gets two +1/+1 counters. Once per turn, so Hill Giant is no
  longer offered. Not offered on opponents' turns or with fewer than 3 other cards. Stormshriek
  Feral is offered only as the creature, never as Flush Out. A creature cast this way is not
  'escaped'.

### Necromantic Selection, Reunion of the House

*New decision* — 7753c2e8 (every-graveyard choice; target group with a total-power cap)

- **Setup:** Necromantic Selection: you have 7 black sources and Grizzly Bears; the opponent has
  Serra Angel and a Soldier token, plus Hill Giant already in their graveyard. Selection in hand.
  Reunion of the House: 7 white sources; your graveyard holds Serra Angel x2 (power 4), Hill Giant
  (3), Grizzly Bears (2) and Ornithopter (0). Reunion in hand.
- **Do:** Cast Necromantic Selection and pick from the graveyard viewer. Then cast Reunion and build
  its target set in the graveyard picker.
- **Check:** Selection: everything is destroyed. The picker ('Choose a card to put onto the
  battlefield') offers only creature cards destroyed by this spell, from any graveyard: your Bears
  and their Angel. Not the token (not a card), not the Hill Giant that was already there. You must
  pick one (no 'none'). The Angel enters under YOUR control but is still owned by the opponent,
  white AND black, Angel Zombie, and stays yours past later state-based checks. Selection is exiled.
  Reunion: Confirm stays disabled while the total power exceeds 10. After two Angels (8), Hill Giant
  no longer fits, Bears does (10), and Ornithopter (0) always fits (ruling). All return together;
  Reunion is exiled.
- **Known limits:** Reunion's recheck at resolution (total gone over 10 makes every target illegal)
  needs a power change in the graveyard, such as a characteristic-defining ability; that's hard to
  set up by hand.

### Protector of the Wastes, Run Away Together

*New decision* — 7753c2e8 (targets controlled by different players; monstrosity)

- **Setup:** Use a 3-player game. You: 6 white sources plus 5 more for monstrosity, Protector in
  hand, your own Sol Ring, Grizzly Bears, Run Away Together. Opponent B: two Sol Rings and two
  creatures. Opponent C: one artifact or enchantment and one creature. Variant: 2-player.
- **Do:** Cast Protector; at its enter trigger, pick B's Sol Ring first and look at the second slot.
  Later activate monstrosity ({4}{W}). Cast Run Away Together, picking one of B's creatures first.
- **Check:** Protector's second slot never offers B's other Sol Ring. It offers C's permanent or
  yours (in 2-player, yours: 'different players' includes you). Both slots are optional ('up to
  two'), and both targets are exiled together. Monstrosity: 3 counters, and the same exile trigger
  fires again. Run Away Together's second slot excludes B's other creature but offers yours or C's.
  It isn't castable at all when one player controls every creature. If one player controls both
  targets at resolution, both are illegal and nothing returns (ruling).
- **Known limits:** Monstrous has no tile badge (log only). A second monstrosity activation is legal
  and simply does nothing; that isn't a bug.

### Eliminate the Competition, Young Pyromancer

*Rules call* — abdcce91 + deb1f3be (sacrifice costs of several permanents)

- **Setup:** Your turn, precombat main. You: 5 untapped Swamps; on the battlefield Grizzly Bears,
  Hill Giant and Young Pyromancer (all yours). Opponent: Grizzly Bears and Serra Angel. Your hand:
  Eliminate the Competition.
- **Do:** Cast Eliminate the Competition. Choose X in the X prompt, pick exactly X target creatures,
  then answer the sacrifice prompt that comes up once the spell is on the stack. Run it 3 times: (a)
  X=2, target both opposing creatures, sacrifice Bears and Hill Giant. (b) X=2, target one opposing
  creature and your own Hill Giant, then sacrifice Hill Giant as one of the two. (c) X=1 and
  sacrifice Young Pyromancer.
- **Check:** The X prompt tops out at the number of creatures you can sacrifice (3 here), not at the
  number of targets. Target selection wants exactly X targets. The sacrifice prompt reads 'Eliminate
  the Competition: Sacrifice X - n/X chosen', offers only your own creatures, and arrives with the
  spell already on the stack. Nobody gets priority between announcing the spell and paying for it
  (the 2016 ruling). (a) Both opposing creatures are destroyed. (b) The sacrificed Hill Giant is an
  illegal target by resolution, so only the other target is destroyed. (c) Rule 601.2i: a spell
  becomes cast only after all its costs are paid, and Young Pyromancer has left by then, so it
  should make NO Elemental token. Also: X=3 when you control only 2 creatures is refused.
- **Known limits:** Probable engine bug in (c), not yet seen live. Casualty explicitly drops the
  cast triggers of a creature sacrificed as a cost (game.ts dropCastTriggersOf, 'a Young Pyromancer
  paid as the cost makes no Elemental'). The new sacrifice-of-several path emits spell-cast before
  beginCostSacrifice and never calls that cleanup, so Young Pyromancer probably still makes a token.
  If it does, that's a real 601.2i bug. Not on the list yet: 'sacrifice any number of' whose count
  changes the cost (Dargo, Plumb the Forbidden; AUTHORING section 15).

### Dread Return, River Kelpie

*Rules call* — abdcce91 + deb1f3be (sacrifice costs of several permanents) / 7753c2e8 (River Kelpie)

- **Setup:** Your turn, precombat main. Your graveyard: Dread Return and Serra Angel. Your
  battlefield: River Kelpie, Grizzly Bears, Hill Giant and Llanowar Elves (4 creatures, so
  'sacrifice three' is a real choice). A few cards in your library.
- **Do:** Open your graveyard and cast Dread Return with flashback (the button should read 'Cast
  flashback'). Target Serra Angel, then choose 3 creatures in the sacrifice prompt. Run 1: keep
  River Kelpie. Run 2 (fresh board): sacrifice River Kelpie as one of the three.
- **Check:** The target is chosen before the sacrifice, so only cards already in your graveyard are
  offered and a creature you sacrifice can't come back (2022 ruling). Dread Return goes to exile,
  not the graveyard. Run 1: Kelpie draws once for a spell cast from a graveyard and once when Serra
  Angel enters from a graveyard, so 2 cards. Run 2: Kelpie had left before the spell became cast
  (601.2i), so its cast trigger should NOT draw. Persist returns it with a -1/-1 counter, and it
  sees itself enter from a graveyard (draw 1). The persist trigger resolves above Dread Return, so
  when the Angel enters Kelpie is back and draws again. Expected total: 2 draws, none from the cast.
  With exactly 3 creatures you get no prompt and all three go.
- **Known limits:** Same probable 601.2i bug as Eliminate the Competition: the sacrifice of several
  happens after the spell-cast event and doesn't withdraw the sacrificed permanents' cast triggers,
  so Run 2 may draw an extra card from the cast trigger. A flashback granted for mana
  (Snapcaster-style) correctly sacrifices nothing.

### Westvale Abbey, Ormendahl, Profane Prince, Bastion of Remembrance

*Rules call* — abdcce91 + deb1f3be (sacrifice costs of several permanents)

- **Setup:** Your turn, precombat main. You: Westvale Abbey (untapped), 5 untapped Wastes, Bastion
  of Remembrance, and 5 Human Cleric tokens (or make them with the Abbey's second ability: {5}, {T},
  pay 1 life each). For the prompt variant, add a 6th creature such as Grizzly Bears. Opponent at a
  known life total.
- **Do:** Activate '{5}, {T}, Sacrifice five creatures: Transform this land, then untap it.' Then go
  to combat and attack with Ormendahl.
- **Check:** With exactly 5 creatures there's no prompt; with 6 you get 'Sacrifice 5'. All five die
  in one event, so Bastion triggers 5 times: opponent -5, you +5 (603.10a). A whole stack of 5
  tokens counts as 5 deaths, not 1. The Abbey turns into Ormendahl, Profane Prince: art and name
  change, 9/7 flying, lifelink, indestructible, haste, UNTAPPED. With haste it can attack this same
  turn.

### Mondrak, Glory Dominus, Zopandrel, Hunger Dominus, Hydra Broodmaster

*Rules call* — abdcce91 (Mondrak, Zopandrel) / 7753c2e8 + 2840ba65 (Hydra Broodmaster)

- **Setup:** You: Mondrak and Zopandrel on the battlefield; Grizzly Bears, Sol Ring and a Treasure
  token; Plains, Forests and other lands (7+ including a Forest for Hydra). Hydra Broodmaster on the
  battlefield (not summoning-sick). Opponent: Grizzly Bears.
- **Do:** Activate Mondrak's ability, paying {W/P} once with W and once with 2 life. Activate
  Zopandrel's {G/P}{G/P} ability. Go to combat on your turn and on the opponent's turn. Activate
  Hydra Broodmaster's {X}{X}{G} monstrosity with X=2.
- **Check:** Mondrak and Zopandrel each offer only OTHER permanents to sacrifice; Mondrak takes
  artifacts and/or creatures, Zopandrel only creatures. Each gets an indestructible counter. Two
  sacrificed together die as one event (603.10a). Zopandrel triggers at the beginning of EVERY
  combat, opponents' included, and doubles only your creatures' power and toughness until end of
  turn (your Bears 4/4, theirs 2/2). Hydra: the X prompt caps at what you can pay twice over plus
  {G}. It gets 2 counters and becomes monstrous. Its trigger makes 2 Hydra tokens, 2/2 each; with
  Mondrak that's 4 tokens. A populate or clone copy of a Hydra is also 2/2, not a 0/0 that dies
  (fixed in 2840ba65; rules 111.3, 707.2).
- **Known limits:** No tile badge shows that a creature is monstrous; only the log line and counters
  show it.

### Whirlwing Stormbrood, Thundermane Dragon, Marang River Regent, Glorybringer, Grizzly Bears

*Rules call* — 7753c2e8 (Omen judged as the face being cast, 601.3e / 720.3a)

- **Setup:** You: Whirlwing Stormbrood and Thundermane Dragon on the battlefield, lots of mana.
  Hand: Glorybringer, Grizzly Bears, a second Whirlwing Stormbrood, Stormshriek Feral. Library top:
  Marang River Regent. A creature of yours to target.
- **Do:** On the opponent's turn (or with a spell on the stack): try casting Glorybringer, Grizzly
  Bears, the second Whirlwing as Dynamic Soar, and Stormshriek Feral as Flush Out. On your main
  phase, look at the library top and see what can be cast from it.
- **Check:** At instant speed: Glorybringer (a Dragon) yes, Dynamic Soar and Flush Out (sorceries)
  yes, Grizzly Bears no. From the library top under Thundermane: Marang River Regent as a creature
  (power 6) is offered and gains haste. Coil and Catch is NOT offered: the Omen face is an instant
  with no power, and the card is judged as the spell it would be (Omen ruling's Thundermane example;
  601.3e).

### Stormbreath Dragon, Giggling Skitterspike, Giant Growth

*Rules call* — 7753c2e8 (monstrosity; 800.4a defender fix)

- **Setup:** Use a 3- or 4-player game. Opponents have different hand sizes (e.g. 2 and 5 cards);
  one opponent is at 5 life with a creature that could block. You: Stormbreath Dragon with {5}{R}{R}
  open, Giggling Skitterspike (not summoning-sick) with {5} open, Giant Growth in hand.
- **Do:** Activate Stormbreath's monstrosity, then activate it again later. Activate Skitterspike's
  monstrosity (now 6/6), cast Giant Growth on it, then attack the 5-life opponent with it.
- **Check:** Stormbreath gets 3 counters and becomes monstrous. Each opponent takes damage equal to
  cards in THEIR OWN hand, counted on resolution (ruling). A second activation does nothing: no
  counters, no damage. Protection from white still applies. Skitterspike: Giant Growth targeting it
  triggers 6 to each opponent first, then the pump (9/9). Attacking triggers damage equal to its
  power to EACH opponent before blockers. The 5-life opponent dies, is not asked to declare
  blockers, and their permanents leave the game (800.4a, the fuzzer fix). Blocking with Skitterspike
  also triggers.
- **Known limits:** No 'monstrous' badge on tiles; only the log line 'X becomes monstrous' and the
  counters show it.

### Behind the Scenes, Sidar Kondo of Jamuraa

*Rules call* — 7753c2e8 (skulk, flanking, block restriction)

- **Setup:** Easiest if you can drive the defending seat (a second browser tab or a seat the
  scenario builder lets you control). Attacker: Behind the Scenes, Sidar Kondo of Jamuraa (2/5),
  Grizzly Bears, and Sidar with a +1/+1 counter or a pump for the flanking check. Defender: Hill
  Giant (3/3), Serra Angel (4/4 flier), Grizzly Bears, Llanowar Elves.
- **Do:** Attack with Bears and Sidar, and declare blocks from the defending seat.
- **Check:** Skulk: a creature with GREATER power can't block (Hill Giant can't block the 2/2 Bears;
  Bears and Elves can, since equal or lower is fine). Sidar's static: opponents' creatures without
  flying or reach can't block creatures with power <= 2. Only Serra Angel can block a 2-power
  attacker, and this applies even when another player is attacking. Flanking: a blocker without
  flanking gets -1/-1 until end of turn (Angel blocking Sidar becomes 3/3). A Sidar at base 2 power
  can't be blocked by Hill Giant at all, which is why the test pumps it. Power changing after blocks
  doesn't undo a block (ruling). Illegal blockers should not be selectable in the blocker UI.
- **Known limits:** Against a bot defender you only see that the bot's blocks are legal; the blocker
  UI itself needs you in the defending seat.

### Millikin

*Rules call* — 7753c2e8 (mill as a cost; 605.1a)

- **Setup:** Your main phase. Millikin on the battlefield (not summoning-sick), a known card on top
  of your library, a 1-mana colourless-payable spell in hand. Variant: empty library.
- **Do:** Activate Millikin. Separately, start casting a spell and look at what the payment step
  offers.
- **Check:** The top card is milled immediately as the cost, and the ability goes on the stack where
  players can respond. {C} is added only on resolution. It isn't a mana ability (Millikin's 2026
  ruling; 605.1a), so it must not appear as a mana source while you pay for a spell, and auto-pay
  must not count it. The {C} empties at the end of the step. Not activatable with an empty library.

## Copying abilities, and winning and losing the game (2026-10-03, second round)

### Lithoform Engine

*New decision* — 87eaeb15 + 8e979efb (copy-ability)

- **Setup:** 2 players, your precombat main. You: Lithoform Engine (untapped), Prodigal Sorcerer
  (not summoning sick), about 8 untapped lands, a library of 5 or more cards. Hand: Elvish
  Visionary, Grizzly Bears. Opponent: Llanowar Elves and their own Prodigal Sorcerer (not summoning
  sick). The Engine taps for each ability, so run steps (c) and (d) on later turns or in fresh
  scenarios.
- **Do:** (a) Activate your Sorcerer targeting the opponent. Keep priority and activate the Engine's
  {2},{T} ability, picking the Sorcerer's ability on the stack as its target. When asked about new
  targets for the copy, change it to the opponent's Llanowar Elves. (b) On the opponent's turn, they
  activate their Sorcerer at you. Try to point the Engine's {2} ability at their ability. (c) Cast
  Elvish Visionary, and with its enters trigger on the stack, use the Engine's {2} on that trigger.
  (d) Cast Grizzly Bears and use the Engine's {4} ability on the Bears spell.
- **Check:** (a) Clicking an ability on the stack works as a target. The new-targets prompt shows
  the current target (the opponent) already chosen and lets you keep it or change it. The copy
  resolves first. The Elves die and the opponent loses 1. The log reads "copies an ability of
  Prodigal Sorcerer", and the copy's damage comes from the Sorcerer (rule 707.10b). (b) The
  opponent's ability is never offered: the Engine only copies abilities you control, and mana
  abilities never appear as targets. (c) The trigger copies with the same trigger object and you
  draw 2 cards in total. (d) No new-targets prompt (a permanent spell's copy can't get new targets).
  The copy enters as a token Grizzly Bears next to the real one. The {3} ability should only offer
  instants and sorceries you control, and the {4} ability only permanent spells.
- **Known limits:** Nothing recorded for this card. The pass's tests don't cover copying an ability
  that divides damage (e.g. Inferno Titan's enters trigger). By the rulings the division stays and
  only the targets may change, so that is worth one look.

### Illusionist's Bracers

*New decision* — 87eaeb15 (activates-ability trigger)

- **Setup:** 2 players, your main phase. You: Illusionist's Bracers attached to Prodigal Sorcerer
  (not sick), plus Llanowar Elves and Sakura-Tribe Elder (not sick) and {3}+ spare mana for
  re-equipping. Optional: Sublime Epiphany with 4UU. Opponent: Llanowar Elves.
- **Do:** (1) Activate the Sorcerer targeting the opponent. (2) Re-equip Bracers to your Llanowar
  Elves and tap the Elves for mana. (3) Re-equip to Sakura-Tribe Elder and activate its sacrifice
  ability. (4) Optional: equipped to the Sorcerer again, activate it. Then, with the Bracers trigger
  above the ability, cast Sublime Epiphany choosing only the 'counter target activated or triggered
  ability' mode, targeting the Sorcerer's ability (not the trigger).
- **Check:** (1) The Bracers trigger fires on its own and the copy asks for new targets (pick their
  Elves): the Elves die and the opponent loses 1. (2) Nothing triggers, because a mana ability never
  uses the stack. (3) No copy: once the cost is paid the Bracers equip nothing (ruling). (4) The
  original ability is countered but the copy is still made as it last was, so the opponent still
  takes 1.
- **Known limits:** 'Whenever you activate an ability' (Rings of Brighthearth) isn't built because
  cycling doesn't use the stack (BACKLOG). That doesn't affect the Bracers.

### Inalla, Archmage Ritualist, Virtue of Knowledge, Electroduplicate

*New decision* — 87eaeb15 (eminence, granted haste, trigger doublers reach only permanents)

- **Setup:** Commander game with Inalla as your commander, still in the command zone. Your precombat
  main, plenty of U/B/R mana. Hand: Prodigal Sorcerer x2, Elvish Visionary. For part (d), 4 more
  Wizards on the battlefield, one of them just cast (summoning sick). For part (c), Virtue of
  Knowledge on the battlefield. Optional: Electroduplicate.
- **Do:** (a) Cast Prodigal Sorcerer. When asked 'Pay {1} to create a token copy of that Wizard?',
  say yes. Tap the token right away to ping, then pass to the end step. (b) Repeat but decline. (c)
  With Virtue of Knowledge out and Inalla still in the command zone, cast a Wizard. Then cast Inalla
  and cast another Wizard. Also cast Elvish Visionary under Virtue. (d) Activate 'Tap five untapped
  Wizards you control: target player loses 7', choosing Inalla and the summoning-sick Wizard among
  the five. (e) Optional: Electroduplicate a creature, then copy that token.
- **Check:** (a) Exactly one {1} prompt, once per resolution. The token has haste (its {T} works
  this turn) and is exiled at the next end step. (b) Declining makes nothing, and a token Wizard
  entering doesn't trigger eminence. (c) From the command zone Virtue does NOT double eminence: one
  prompt. Eminence there isn't the ability of a permanent you control. With Inalla on the
  battlefield it does: two prompts, up to two tokens. Elvish Visionary draws 2. (d) The tap-cost
  picker lets you choose exactly which five, summoning-sick Wizards and Inalla included (tapping
  them isn't {T}, rule 302.6), and the target loses 7. (e) Electroduplicate's haste and its
  'sacrifice at the beginning of the end step' are copy exceptions, so a copy of that token has them
  too. Inalla's 'the token gains haste' is not copiable.
- **Known limits:** Eminence is miscited as rule 702.106 in source comments (BACKLOG). Only the
  comments are wrong, not the behaviour. The Virtue-doubles-eminence-on-the-battlefield case follows
  from Virtue's text but isn't in the pass's tests.

### Thousand-Year Storm, Brain Freeze

*New decision* — 87eaeb15 (copy-spell count, countCastBefore)

- **Setup:** 2 players, your precombat main. You: Thousand-Year Storm on the battlefield, lots of
  U/R mana. Hand: Opt, Grizzly Bears, Shock x2, Lightning Bolt x2, Brain Freeze. Opponent: Grizzly
  Bears, Llanowar Elves, and a Counterspell with UU open (optional).
- **Do:** Cast Opt, then Grizzly Bears, then Shock at the opponent. When the copy asks for a target,
  pick their Bears. Then cast Lightning Bolt and give each copy a different target (Elves, face).
  Optional: the opponent counters one of your spells, and you cast another. Holding priority: cast
  Lightning Bolt and, before passing, cast Shock. Last, cast Brain Freeze targeting the opponent.
- **Check:** Copies made = instants and sorceries you cast earlier this turn. Creature spells don't
  count (Opt 0, Shock 1, Bolt 2), countered spells do, and so do spells cast before the Storm
  arrived. Each copy gets its own new-targets prompt, one at a time, so check that it's clear which
  copy you are aiming. Copies resolve before the original and aren't cast (they don't trigger the
  Storm or prowess). The count is fixed as it triggers, so a Shock cast in response to the Bolt
  doesn't add to the Bolt's copies. Brain Freeze's storm counts every spell cast this turn by any
  player, and each copy may pick its own target player.
- **Known limits:** Nothing recorded.

### Chain of Vapor

*New decision* — 87eaeb15 + 8e979efb (each-player-may controllerOfTarget, the copy is theirs)

- **Setup:** 2 players (try 3), two separate devices or seats if possible. Your main phase. You:
  Chain of Vapor and an Island, your own Grizzly Bears, a few lands. Opponent: Grizzly Bears and
  several lands. Variant: Act of Treason in your hand plus mana, and the opponent has a second
  creature.
- **Do:** Cast Chain of Vapor at their Bears. As the opponent: yes to 'Sacrifice a land', pick the
  land, yes to 'Copy Chain of Vapor?', and aim the copy at your Bears. As you: decline. Variant: Act
  of Treason their creature, then Chain of Vapor that creature.
- **Check:** Each prompt appears on the right player's screen. The bounced permanent's controller is
  asked, and then picks which land. The copy is controlled by the opponent and its controller is
  shown in the log, and the chain can go back and forth until someone declines. A player with no
  lands isn't offered the sacrifice. In the Act of Treason variant YOU (the controller as it left,
  rule 608.2h) are asked, not the owner, and the creature goes to its owner's hand.
- **Known limits:** Nothing recorded.

### Sink into Stupor // Soporific Springs

*New decision* — 87eaeb15 (spell-or-permanent target)

- **Setup:** 2 players, opponent's turn. Opponent: Lightning Bolt and Abrupt Decay in hand with
  mana, Grizzly Bears on the battlefield, their lands. You: two copies of Sink into Stupor, 1UU open
  (twice), your own creature, and a land drop for your next turn.
- **Do:** Opponent Bolts you, and you respond with Sink into Stupor, clicking the Bolt on the stack.
  Next, cast one at their Grizzly Bears. Try aiming it at their land, at your own creature, and at
  your own spell. Also try it on Abrupt Decay (can't be countered). On your turn, play the other
  copy as its land face.
- **Check:** One target slot accepts either a spell on the stack or a nonland permanent, but only
  the opponent's. Their lands, your permanents and your spells aren't offered. The Bolt goes back to
  its owner's hand without resolving, and the log should say it was returned, not countered. That
  works on Abrupt Decay too. The Bears go to hand. As a land, Soporific Springs asks 'pay 3 life?':
  paying means it enters untapped and you lose 3, declining means it enters tapped.
- **Known limits:** Nothing recorded. A copy of a spell sent to hand stops existing (ruling); try it
  if you have an opponent's copy on the stack.

### Wandering Archaic // Explore the Vastlands

*New decision* — 87eaeb15 (opponent asked; look-and-choose player: that-player)

- **Setup:** 2 players. Part A: Wandering Archaic on your battlefield. The opponent has Lightning
  Bolt in hand, once with exactly one untapped Mountain and once with three untapped lands. Part B:
  Explore the Vastlands in your hand with {3}. Each library's top five is a known mix: lands, an
  instant or sorcery, creatures.
- **Do:** Part A: the opponent Bolts you. With spare mana they answer 'Pay {2}', once declining and
  once paying. Part B: cast Explore the Vastlands (the back face). Pick a land and then an instant
  or sorcery from your top five, then watch the opponent pick on their seat.
- **Check:** Part A: the opponent (not you) gets the pay {2} question. If they can't afford {2} they
  aren't asked at all. Unpaid: you're asked 'Copy that spell?', you may retarget it (e.g. to them),
  and your copy resolves before their Bolt. Paid: no copy. Part B: the active player picks first,
  and both picks are optional. Other players see only the cards you reveal, never the other three
  you looked at. The opponent chooses after seeing your reveals. The rest go to the bottom in random
  order, and everyone gains 3 whether they took anything or not.
- **Known limits:** Nothing recorded.

### Thassa's Oracle

*New decision* — 9b3a0ed5 (win-game, library-size compare)

- **Setup:** 2 or 3 players, your main phase, UU available. Run three ways: (a) your library has
  exactly 2 cards and you have no other blue permanents; (b) the library has 5 known cards; (c) a
  Laboratory Maniac (one {U}) is also out and the library has 3 cards. Optional: an opponent with
  instant-speed removal.
- **Do:** Cast Thassa's Oracle and let its enters trigger resolve. In (b), keep the second card on
  top. Optional: the opponent kills the Oracle in response to the trigger.
- **Check:** Devotion is counted as the trigger resolves and includes the Oracle's own UU if it's
  still there. (a) Devotion 2 is at least the library of 2, so you win at once. A multiplayer game
  ends with you as winner (rule 104.2b), and the result shows 'won the game with Thassa's Oracle'.
  (b) The look shows only the top 2. Your pick stays on top, the other goes to the bottom, and no
  win. (c) Devotion 3 against a library of 3 wins (equal counts). With the Oracle removed in
  response, devotion drops by 2.
- **Known limits:** BACKLOG 'A look at nothing still asks': with an empty library you get an empty
  choose-from-library prompt. Answer it and you still win.

### Pact of Negation, Summoner's Pact

*New decision* — 9b3a0ed5 + d73afb34 (delayed lose-game, unless-pay)

- **Setup:** 2 players. You: Pact of Negation and Summoner's Pact in hand, Islands and Forests on
  the battlefield, green creatures (and a non-green creature) in your library. Opponent: Grizzly
  Bears to cast, Abrupt Decay, Counterspell.
- **Do:** The opponent casts the Bears and you Pact of Negation it for {0}. At your next upkeep,
  pay. In a second run, tap out (or have too few lands) before your upkeep. Third run: the opponent
  Counterspells your Pact. Fourth run: Pact of Negation an Abrupt Decay. Cast Summoner's Pact on
  your own turn.
- **Check:** At your NEXT upkeep (even if the Pact was cast on an opponent's turn) you're asked 'Pay
  {3}{U}{U}.'. Check that it's clear declining loses, and which lands get tapped. If you can't pay,
  there's no prompt: you lose at once ('lost the game to Pact of Negation'). A countered Pact sets
  no upkeep trigger. Against Abrupt Decay the Pact resolves, Decay isn't countered, and you must
  still pay (ruling). Summoner's Pact only offers green creature cards, reveals the pick, then asks
  for {2}{G}{G}.
- **Known limits:** The payment is offered only when you can afford it. Otherwise the loss is
  automatic (by design).

### Mirrodin Besieged

*New decision* — 9b3a0ed5 + 2ff7b9b0 (chosen-on-enter gate resolves without its source)

- **Setup:** 3 players, your main phase, {2}{U}. Your graveyard has 14 artifact cards and your hand
  has an artifact card to discard (or 15 in the graveyard). An opponent has instant-speed
  enchantment removal (e.g. Abrupt Decay). Second run: Mirran side, with Sol Ring in hand.
- **Do:** Cast Mirrodin Besieged and choose Phyrexian. Go to your end step. Choose the target
  opponent and resolve, discarding the artifact. Variant: the opponent destroys Besieged in response
  to the end-step trigger. Mirran run: cast Sol Ring.
- **Check:** The Mirran or Phyrexian choice appears as it enters. At your end step you pick a target
  opponent as the trigger goes on the stack, even with fewer than 15 artifacts. As it resolves you
  draw, discard, then count. Discarding the 15th artifact makes the target lose (ruling), and the
  game continues for the other two. Destroying Besieged in response doesn't stop it (rule 113.7a;
  fixed in 2ff7b9b0). Mirran: casting an artifact gives a 1/1 Myr, and that side has no end-step
  trigger.
- **Known limits:** BACKLOG 'A Siege's chosen side as it leaves' covers only leaves-the-battlefield
  triggers on Sieges. That doesn't affect this card.

### Weaver of Harmony, Virtue of Knowledge // Vantress Visions, Mirrormade

*Rules call* — 87eaeb15 + 8e979efb (copy-ability, 'from an enchantment source', source as it last existed)

- **Setup:** 2 players, your main phase. You: Weaver of Harmony (not summoning sick), a second
  enchantment creature (e.g. another Weaver), Prodigal Sorcerer, Forests plus W and U sources. Hand:
  Banishing Light, Mirrormade, Virtue of Knowledge. Opponent: Grizzly Bears, Llanowar Elves, Mind
  Stone, and Abrupt Decay with mana to cast it.
- **Do:** (1) Cast Banishing Light targeting their Bears. With its exile trigger on the stack,
  activate Weaver ({G},{T}) targeting that trigger, and change the copy's target to their Elves.
  Then the opponent Abrupt Decays the Banishing Light. (2) Activate your Sorcerer and try to target
  its ability with Weaver. (3) Cast Mirrormade copying their Mind Stone. Activate its '{1},{T},
  Sacrifice: draw a card' and try to target that ability with Weaver. (4) Cast Vantress Visions (the
  Adventure, {1}{U}) targeting your Sorcerer's ability on the stack.
- **Check:** Weaver gives +1/+1 to other enchantment creatures, not to itself. (1) Both Bears and
  Elves are exiled, and both come back when Banishing Light leaves (a copy of a linked ability is
  linked too: the Lithoform/Vantress rulings). (2) The Sorcerer's ability is not offered, because
  its source isn't an enchantment. (3) The Mind Stone ability is not offered either. Its source is
  an enchantment card in the graveyard now, but as it last existed on the battlefield it was an
  artifact (rule 113.7a; fixed in 8e979efb). (4) The Sorcerer's ability is copied with a new-targets
  prompt. The card then goes to exile on an adventure, and Virtue of Knowledge can be cast from
  there later.
- **Known limits:** Nothing recorded.

### Sword of Wealth and Power, Thunderclap Drake, Primal Amulet // Primal Wellspring

*Rules call* — 87eaeb15 (delayed next-spell copies, mana rider 'that spell')

- **Setup:** Commander game, your turn. You: Sword of Wealth and Power on an unblocked-able Grizzly
  Bears (not sick); Thunderclap Drake; Primal Amulet with 3 charge counters. Cast your commander
  from the command zone twice earlier (it died and was recast) so the cast count is 2. Hand:
  Lightning Bolt x3, Opt, a creature spell. Opponent: Lightning Bolt with R open, Prodigal Sorcerer,
  Counterspell (optional).
- **Do:** (1) Opponent tries to Bolt your equipped Bears; then attack with it. After combat damage,
  cast Lightning Bolt, then a second instant. (2) Activate Thunderclap Drake ({2}{U}, sacrifice) and
  cast an instant. (3) Cast an instant so the Amulet gets its 4th counter: decline the transform
  prompt, then on the next instant accept it. Tap Wellspring for R and spend it on a Lightning Bolt;
  the opponent Counterspells that Bolt. Tap it again on a later turn and spend it on a creature
  spell.
- **Check:** (1) Bolt can't target the equipped creature (protection from instants), though the
  Sorcerer's ability can. Combat damage gives a Treasure, the next instant or sorcery this turn is
  copied once, and the one after it isn't. Nothing carries to the next turn. (2) Copies equal to
  your commander casts from the command zone (2; partners' casts added together). With none, no
  copies. Drake makes instants and sorceries cost {1} less (generic only). (3) The optional prompt
  'Remove the charge counters and transform Primal Amulet?' appears at 4 and comes back on the next
  instant if you decline. Accepting removes every counter and flips it to the land. Wellspring mana
  spent on the Bolt copies it even though the Bolt is countered before the rider resolves (ruling).
  Spent on a creature, no copy.
- **Known limits:** Nothing recorded.

### Reverberate, Dualcaster Mage, Kitsa, Otterball Elite

*Rules call* — 87eaeb15

- **Setup:** 2 players. Opponent's turn: they have Lightning Bolt, Divination and Izzet Charm in
  hand with mana, and Grizzly Bears out. You: Reverberate (RR) and Dualcaster Mage (1RR) in hand
  with mana open. For the Kitsa part, your own turn: Kitsa on the battlefield (power 1), Opt and
  Brainstorm in hand, {2} extra.
- **Do:** Opponent Bolts you, and you Reverberate it, aiming the copy at their face. Opponent casts
  Divination, and you flash in Dualcaster Mage targeting it. Opponent casts Izzet Charm choosing '2
  damage to target creature' on one of yours, and you copy it. On your turn: check Kitsa's copy
  ability before and after casting Opt and Brainstorm (prowess takes her to 3), then copy the
  Brainstorm.
- **Check:** You control each copy and it resolves first. The Divination copy makes YOU draw 2:
  'you' on a copy is its controller. The Izzet Charm copy keeps the damage mode and offers no other
  mode, and you may retarget it. Kitsa's copy ability is unavailable at power 1 or 2 and available
  at 3. It only targets instants and sorceries you control, never the opponent's. Once it's
  activated, losing the power doesn't stop it.
- **Known limits:** Nothing recorded.

### Jin-Gitaxias, Progress Tyrant

*Rules call* — 87eaeb15 (oncePerTurn copy and counter)

- **Setup:** 3 players. You: Jin-Gitaxias on the battlefield. Hand: Sol Ring x2, Opt. Players B and
  C each have Lightning Bolt or Shock with mana open.
- **Do:** On your turn, cast Sol Ring, then the second Sol Ring and Opt. On a later turn, B casts
  Lightning Bolt and then C casts Shock in the same turn. On the following turn, an opponent casts
  another instant.
- **Check:** Your first artifact, instant or sorcery each turn is copied: a Sol Ring copy enters as
  a token. Later ones that turn aren't copied. B's Bolt is countered automatically, but C's Shock
  that same turn resolves: the counter triggers once each turn in total, not once per opponent
  (ruling). Both abilities reset the next turn. If Jin arrived after you already cast an artifact
  this turn, your next one is still copied (once per this object).
- **Known limits:** Nothing recorded.

### Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief

*Rules call* — 9b3a0ed5 + 2ff7b9b0 (would-draw win, can't lose / can't win)

- **Setup:** 2 players. You: Laboratory Maniac, a library of 1 card (then 0), Divination and Opt in
  hand. Variants: (i) the opponent has Platinum Angel; (ii) you have Platinum Angel and are at 1
  life, and the opponent has Lightning Bolt; (iii) you have Notion Thief as well as Lab Man, with an
  empty library, and the opponent has Divination; (iv) Jace, Wielder of Mysteries at 8 loyalty with
  a 5-card library, no Lab Man.
- **Do:** Base: cast Divination. (i) Draw from the empty library. (ii) Get Bolted to −2. Keep
  playing a turn or two, then destroy your Angel. Concede in a separate run. Herald of Eternal Dawn
  the same way, flashed in at instant speed. (iii) The opponent casts Divination. (iv) Use Jace's −8
  (Jace dies for the loyalty cost before it resolves). Also use the +1 targeting yourself.
- **Check:** Base: you draw the 1 card, the second draw is replaced, and you win ('won the game with
  Laboratory Maniac'). (i) Nothing happens: the draw is still replaced, so you don't win and you
  also don't lose at the next check (rulings). (ii) You stay in the game at 0 or less life, with 10
  poison too. You lose at the next check once the Angel leaves, and conceding loses even with the
  Angel out (rule 104.3a). An opponent's 'win the game' does nothing while it's out. (iii) Their
  draws become yours and you win (rule 616.2). (iv) Seven draws from 5 cards still wins, before the
  state-based loss. The +1 mills two from you, then draws.
- **Known limits:** Notion Thief redirects every opponent draw instead of sparing their first
  draw-step draw (BACKLOG, a rule-zero defect). With the opponent's Notion Thief and your Lab Man,
  the win is applied first, with no replacement-order choice offered. When you can't win, letting
  the Thief's controller draw instead isn't offered (AUTHORING §15).

### Angel's Grace

*Rules call* — 9b3a0ed5 (player-effect cantLoseGame, damageLifeFloor)

- **Setup:** 2-player Commander or normal game, opponent's turn, declare blockers step. You: at 3
  life with W open and Angel's Grace in hand. Opponent: attacking you with Vampire Nighthawk
  (lifelink) and Serra Angel, no blocks. They hold Lightning Bolt and Sign in Blood with mana open.
- **Do:** Cast Angel's Grace. While it's on the stack, the opponent tries to respond. Let combat
  damage happen. After combat, the opponent casts Sign in Blood targeting you, then Lightning Bolt
  at you. Pass to the end of turn.
- **Check:** Split second: while it's on the stack the opponent is offered only mana abilities.
  Combat damage leaves you at 1, not below, and the opponent still gains 2 from lifelink (the damage
  is dealt in full). Sign in Blood's life LOSS isn't stopped, so you drop to −1, and the Bolt at −1
  lowers you further (ruling). You don't lose this turn. In the cleanup step the effect ends and you
  lose at that check, before the next turn. Opponents can't win this turn either. In Commander,
  commander damage is still tracked.
- **Known limits:** Nothing recorded.

### Everybody Lives!

*Rules call* — 9b3a0ed5 + 2ff7b9b0 (cantLoseLife and canPayLife, rule 119.8)

- **Setup:** 2 players, your main phase. You: Everybody Lives! ({1}{W}), Toxic Deluge with BBB,
  Dismember with exactly {1} plus no spare black, Steam Vents (land drop unused), Night's Whisper, a
  creature. Opponent: creatures, Lightning Bolt with R open.
- **Do:** Cast Everybody Lives!. The opponent Bolts you, and then you: cast Night's Whisper, try
  Toxic Deluge, try Dismember paying life for its Phyrexian pips, play Steam Vents, try to target
  the opponent or their creatures, try to destroy something. Pass the turn.
- **Check:** Damage and life loss change nothing: the Bolt does nothing to your life, and Night's
  Whisper draws 2 with no life lost. Life gain still works. Toxic Deluge can be cast only with X =
  0. Dismember's pips must be paid with mana. Steam Vents offers no 'pay 2 life' and enters tapped.
  Opponents and every creature have hexproof, and creatures are indestructible. Nobody can win or
  lose this turn. Everything ends at cleanup, and conceding still loses (ruling).
- **Known limits:** Nothing recorded.

### (a player leaving during their own turn), Toxic Deluge, Pact of Negation

*Rules call* — 369460be + d73afb34 (rule 800.4a/800.4j)

- **Setup:** 3 players (A, B, C), A's precombat main. A: at 3 life, three untapped Swamps, Toxic
  Deluge in hand plus 9 other cards (well over 7), an untapped Grizzly Bears that has been there
  since last turn. B and C each have a creature. Alternative: A owes a Pact of Negation they can't
  pay at their next upkeep (the d73afb34 case).
- **Do:** A casts Toxic Deluge with X = 3, paying exactly their life total, which is allowed (rule
  119.4). Watch the rest of the turn from all three seats.
- **Check:** A drops to 0 and loses as soon as state-based actions are checked, before the Deluge
  resolves. The Deluge leaves with A and never resolves, so B's and C's creatures are untouched. A
  is never given priority again. There's no attack declaration for A and no cleanup discard
  (800.4j), and play passes to B. B and C keep playing. A's seat shows A out, with the loss reason.
  With the Pact, A loses in their own upkeep, skips the draw, and the game carries on with B and C.
- **Known limits:** By design, the departed player's permanents stay where they are, visible but out
  of the game (`inGame`). This is not a bug. Not built (BACKLOG 'The rest of leaving the game'): a
  decision the departed player would have made isn't handed to another player (800.4g–h), and a
  permanent whose control effect ends with its default controller gone isn't exiled (800.4c).

### Felidar Sovereign, Test of Endurance, Triskaidekaphile, Helix Pinnacle, Simic Ascendancy, Revel in Riches, Hellkite Tyrant, Knuckles the Echidna

*Rules call* — 9b3a0ed5 (upkeep intervening-if wins)

- **Setup:** Mostly your end step with your next upkeep coming. Felidar Sovereign with you at
  exactly 40, and the opponent holding Lightning Bolt. Triskaidekaphile with 13 cards in hand (then
  14). Helix Pinnacle with 99 tower counters and 1 spare mana, and the opponent holding Abrupt
  Decay. Simic Ascendancy with 19 growth counters, a creature, and {1}{G}{U}. Revel in Riches with 9
  Treasures and an opponent's creature you can kill. 3 players for Hellkite Tyrant: it attacks B,
  and both B and C have artifacts. Knuckles (double strike, trample) attacking alongside another
  creature.
- **Do:** Let each upkeep trigger happen. For Felidar, the opponent Bolts you in response. Activate
  Pinnacle with X = 1. Pump with Simic Ascendancy. Kill an opposing creature, and also one of your
  own, under Revel. Connect with Hellkite and with Knuckles.
- **Check:** Each wins at your upkeep only if the condition holds both as the upkeep begins and as
  the trigger resolves (rule 603.4). Felidar at 40 wins, but Bolted in response to 37 it doesn't.
  Triskaidekaphile wins at exactly 13 and doesn't trigger at 14. It also means no cleanup discard
  (no maximum hand size). The X prompt for the Pinnacle works, and Abrupt Decay can't target it
  (shroud). One +1/+1 counter means 1 growth counter, then a win at 20. Revel gives a Treasure only
  for opponents' creatures dying. Hellkite takes only B's artifacts, permanently, and C's are
  untouched. Knuckles gives one Treasure per combat damage step: 2 with double strike, not one per
  creature.
- **Known limits:** Nothing recorded.

### Twenty-Toed Toad, Reliquary Tower

*Rules call* — 9b3a0ed5 (max hand size in timestamp order, rule 613.11)

- **Setup:** 2 players, your precombat main, land drop unused. Run 1: Twenty-Toed Toad on the
  battlefield, Reliquary Tower in hand, 25 cards in hand. Run 2: Reliquary Tower on the battlefield
  and the Toad cast this turn, 25 cards in hand. Run 3: the Toad (not sick) and Grizzly Bears, 19
  cards in hand, no counters on the Toad.
- **Do:** Runs 1 and 2: go to cleanup. Run 3: attack with both. Two triggers go on the stack
  together; order them so 'put a +1/+1 counter and draw' resolves first. Repeat with the opposite
  order.
- **Check:** Run 1 (Tower newer): no maximum, no discard. Run 2 (Toad newer): you discard down to 20
  at cleanup (Toad ruling). Run 3: the trigger-order prompt appears and reads clearly, including
  which one resolves first. With the draw first you reach 20 cards and win as the attack trigger
  resolves. The other order doesn't win. The win trigger always triggers and checks only on
  resolution, and counters of any kind count.
- **Known limits:** Nothing recorded.

### Approach of the Second Sun, Reverberate

*Rules call* — 9b3a0ed5 (spells-cast-this-game, put-on-library fromTop)

- **Setup:** 2 players, your main phase, 7+ mana including W (twice over, or across turns). Hand:
  Approach of the Second Sun x2. Library of 10+ known cards. Variants: the opponent has
  Counterspell; Reverberate in your hand with RR; a library of only 3 cards.
- **Do:** Cast the first Approach, then draw cards to find it (or note the library order if the
  builder shows it). Cast the second one from hand. Variant: the opponent counters the first, then
  you cast the second. Variant: with the second Approach on the stack, Reverberate it.
- **Check:** First: you gain 7 and it goes under the top six cards (the bottom of a library under 6
  cards). Second from hand: you win. A countered first still counts (ruling). The same card drawn
  again and recast also counts, as a new object (rule 400.7). With Reverberate, the copy (never
  cast) resolves first: you gain 7 and it just stops existing rather than going into the library.
  Then the real one wins.
- **Known limits:** The Reverberate-copy case is from the card's comment and rule 707.10a; the
  pass's tests don't cover it.

### Vorpal Sword, Summon: Primal Odin, Platinum Angel

*Rules call* — 9b3a0ed5 + 2ff7b9b0 (lose-game trigger-player)

- **Setup:** 3 players (you, B, C), your turn. You: Vorpal Sword equipped to an unsick Grizzly Bears
  and 8 mana including BBB. On another turn: Summon: Primal Odin on the battlefield since last turn
  with 1 lore counter. Variant: B controls Platinum Angel. Optional: instant-speed removal for Odin.
- **Do:** Activate Vorpal Sword's {5}{B}{B}{B} ability and attack B. Next turn, attack without
  activating. Odin: in your precombat main it gets lore counter 2 (chapter II resolves). Attack B
  with Odin, and in a variant destroy Odin after its combat-damage trigger goes on the stack.
- **Check:** B loses ('lost the game to Vorpal Sword', or to Summon: Primal Odin). The game goes on
  between you and C, and B's turn is skipped. Without the activation the Sword is only +2/+0 and
  deathtouch. The grant lasts only that turn. Odin's trigger, once on the stack, still makes B lose
  after Odin is gone (ruling). With Platinum Angel, B doesn't lose.
- **Known limits:** Nothing recorded.
