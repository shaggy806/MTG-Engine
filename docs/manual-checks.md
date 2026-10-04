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
| [Nykthos, Shrine to Nyx, Nyx Lotus](#nykthos-shrine-to-nyx-nyx-lotus) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Three Tree City](#three-tree-city) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Mox Amber, The Grey Havens, Plaza of Heroes, Bloom Tender, Faeburrow Elder](#mox-amber-the-grey-havens-plaza-of-heroes-bloom-tender-faeburrow-elder) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Chrome Mox](#chrome-mox) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Mirari's Wake, Zendikar Resurgent, Fertile Ground, Utopia Sprawl](#miraris-wake-zendikar-resurgent-fertile-ground-utopia-sprawl) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Kinnan, Bonder Prodigy](#kinnan-bonder-prodigy) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Deathrite Shaman](#deathrite-shaman) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Culling Ritual, Burnt Offering](#culling-ritual-burnt-offering) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Klauth, Unrivaled Ancient](#klauth-unrivaled-ancient) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Gwenna, Eyes of Gaea](#gwenna-eyes-of-gaea) | new decision | Mana abilities: colours chosen, lands' types, doubling |
| [Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve](#reflecting-pool-horizon-of-progress-incubation-druid-gond-gate-cactus-preserve) | rules call | Mana abilities: colours chosen, lands' types, doubling |
| [Reflecting Pool, The Grey Havens, Chrome Mox, Mox Amber, Wild Growth, Fertile Ground, Kinnan, Bonder Prodigy, Mirari's Wake](#reflecting-pool-the-grey-havens-chrome-mox-mox-amber-wild-growth-fertile-ground-kinnan-bonder-prodigy-miraris-wake) | rules call | Mana abilities: colours chosen, lands' types, doubling |
| [Mana Flare, Heartbeat of Spring](#mana-flare-heartbeat-of-spring) | rules call | Mana abilities: colours chosen, lands' types, doubling |
| [Mana Reflection, Nyxbloom Ancient](#mana-reflection-nyxbloom-ancient) | rules call | Mana abilities: colours chosen, lands' types, doubling |
| [Aragorn, the Uniter, Preordain, Opt, Consider](#aragorn-the-uniter-preordain-opt-consider) | new decision | Library ordering and cards chosen as a cost |
| [Stock Up, Dig Through Time, Experimental Augury, Growing Rites of Itlimoc // Itlimoc, Cradle of the Sun](#stock-up-dig-through-time-experimental-augury-growing-rites-of-itlimoc--itlimoc-cradle-of-the-sun) | new decision | Library ordering and cards chosen as a cost |
| [Halimar Depths, Sensei's Divining Top](#halimar-depths-senseis-divining-top) | new decision | Library ordering and cards chosen as a cost |
| [Valakut Awakening // Valakut Stoneforge](#valakut-awakening--valakut-stoneforge) | new decision | Library ordering and cards chosen as a cost |
| [Teferi's Puzzle Box](#teferis-puzzle-box) | new decision | Library ordering and cards chosen as a cost |
| [Valakut Awakening, Teferi's Puzzle Box, Brainstorm](#valakut-awakening-teferis-puzzle-box-brainstorm) | new decision | Library ordering and cards chosen as a cost |
| [Moorland Haunt, Mines of Moria, Varina, Lich Queen, Psychic Frog, Drivnod, Carnage Dominus](#moorland-haunt-mines-of-moria-varina-lich-queen-psychic-frog-drivnod-carnage-dominus) | new decision | Library ordering and cards chosen as a cost |
| [Key to the City, Ghostly Pilferer](#key-to-the-city-ghostly-pilferer) | new decision | Library ordering and cards chosen as a cost |
| [Sensei's Divining Top](#senseis-divining-top) | rules call | Library ordering and cards chosen as a cost |
| [Psychic Frog, Moorland Haunt, Thrill of Possibility, Nezahal, Primal Tide](#psychic-frog-moorland-haunt-thrill-of-possibility-nezahal-primal-tide) | rules call | Library ordering and cards chosen as a cost |
| [Mesmeric Orb](#mesmeric-orb) | rules call | Library ordering and cards chosen as a cost |
| [Aragorn, the Uniter](#aragorn-the-uniter) | rules call | Library ordering and cards chosen as a cost |
| [Varina, Lich Queen](#varina-lich-queen) | rules call | Library ordering and cards chosen as a cost |
| [Drivnod, Carnage Dominus](#drivnod-carnage-dominus) | rules call | Library ordering and cards chosen as a cost |
| [Nezahal, Primal Tide, Ghostly Pilferer](#nezahal-primal-tide-ghostly-pilferer) | rules call | Library ordering and cards chosen as a cost |
| [Three Steps Ahead](#three-steps-ahead) | new decision | Infect, wither, spree and gift |
| [Insatiable Avarice](#insatiable-avarice) | new decision | Infect, wither, spree and gift |
| [Smuggler's Surprise](#smugglers-surprise) | new decision | Infect, wither, spree and gift |
| [Requisition Raid](#requisition-raid) | new decision | Infect, wither, spree and gift |
| [Dawn's Truce](#dawns-truce) | new decision | Infect, wither, spree and gift |
| [Into the Flood Maw, Long River's Pull, Wear Down, Peerless Recycling, Sazacap's Brew](#into-the-flood-maw-long-rivers-pull-wear-down-peerless-recycling-sazacaps-brew) | new decision | Infect, wither, spree and gift |
| [Octomancer](#octomancer) | new decision | Infect, wither, spree and gift |
| [Final Showdown](#final-showdown) | rules call | Infect, wither, spree and gift |
| [Parting Gust](#parting-gust) | rules call | Infect, wither, spree and gift |
| [Starfall Invocation, Coiling Rebirth](#starfall-invocation-coiling-rebirth) | rules call | Infect, wither, spree and gift |
| [Scrapshooter](#scrapshooter) | rules call | Infect, wither, spree and gift |
| [Blighted Agent, Plague Myr, Ichorclaw Myr, Inkmoth Nexus](#blighted-agent-plague-myr-ichorclaw-myr-inkmoth-nexus) | rules call | Infect, wither, spree and gift |
| [Phyresis, Tainted Strike, Triumph of the Hordes](#phyresis-tainted-strike-triumph-of-the-hordes) | rules call | Infect, wither, spree and gift |
| [Skithiryx, the Blight Dragon](#skithiryx-the-blight-dragon) | rules call | Infect, wither, spree and gift |
| [Massacre Girl, Known Killer, Necroskitter, Midnight Banshee, Hapatra, Vizier of Poisons](#massacre-girl-known-killer-necroskitter-midnight-banshee-hapatra-vizier-of-poisons) | rules call | Infect, wither, spree and gift |
| [Phyrexian Swarmlord, Ichor Rats](#phyrexian-swarmlord-ichor-rats) | rules call | Infect, wither, spree and gift |
| [Strionic Resonator](#strionic-resonator) | new decision | Notion Thief, copied abilities, a departed player's permanents |
| [Peter Parker's Camera, Lithoform Engine](#peter-parkers-camera-lithoform-engine) | new decision | Notion Thief, copied abilities, a departed player's permanents |
| [Battlemage's Bracers](#battlemages-bracers) | new decision | Notion Thief, copied abilities, a departed player's permanents |
| [Increasing Vengeance, Reverberate, Essence Scatter, Frolicking Familiar, Fling](#increasing-vengeance-reverberate-essence-scatter-frolicking-familiar-fling) | new decision | Notion Thief, copied abilities, a departed player's permanents |
| [Ixhel, Scion of Atraxa](#ixhel-scion-of-atraxa) | new decision | Notion Thief, copied abilities, a departed player's permanents |
| [Notion Thief](#notion-thief) | rules call | Notion Thief, copied abilities, a departed player's permanents |
| [Molten Echoes, Flameshadow Conjuring](#molten-echoes-flameshadow-conjuring) | rules call | Notion Thief, copied abilities, a departed player's permanents |
| [Boseiju, Who Endures, (a player who has left the game)](#boseiju-who-endures-a-player-who-has-left-the-game) | rules call | Notion Thief, copied abilities, a departed player's permanents |
| [Dismantling Wave, Windgrace's Judgment, Afterlife from the Loam, The Balrog of Moria (dies trigger)](#dismantling-wave-windgraces-judgment-afterlife-from-the-loam-the-balrog-of-moria-dies-trigger) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Fractured Sanity, Decree of Pain, Agonasaur Rex, Titanoth Rex, Vizier of Tumbling Sands, Magmakin Artillerist, The Balrog of Moria (cycling), Dismantling Wave (cycling)](#fractured-sanity-decree-of-pain-agonasaur-rex-titanoth-rex-vizier-of-tumbling-sands-magmakin-artillerist-the-balrog-of-moria-cycling-dismantling-wave-cycling) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Command Beacon, Hellkite Courser](#command-beacon-hellkite-courser) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Will of the Abzan, Priest of Forgotten Gods, Crackling Doom, Soul Shatter, Will of the Mardu](#will-of-the-abzan-priest-of-forgotten-gods-crackling-doom-soul-shatter-will-of-the-mardu) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Temple of the Dragon Queen](#temple-of-the-dragon-queen) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Quirion Ranger, Mina and Denn, Wildborn, Multani, Yavimaya's Avatar](#quirion-ranger-mina-and-denn-wildborn-multani-yavimayas-avatar) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Myr Battlesphere](#myr-battlesphere) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Lord of the Forsaken, Welcome the Dead, Teval's Judgment, Essence Anchor, Gravecrawler](#lord-of-the-forsaken-welcome-the-dead-tevals-judgment-essence-anchor-gravecrawler) | new decision | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Wonder, Anger, Brawn, Filth](#wonder-anger-brawn-filth) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Legion Warboss, Ainok Strike Leader, Within Range](#legion-warboss-ainok-strike-leader-within-range) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Divine Visitation, Redoubled Stormsinger, Legion Warboss, Ainok Strike Leader, The Balrog of Moria (cycling, for Treasures)](#divine-visitation-redoubled-stormsinger-legion-warboss-ainok-strike-leader-the-balrog-of-moria-cycling-for-treasures) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Sarkhan, Soul Aflame](#sarkhan-soul-aflame) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Colfenor's Urn, Decree of Pain](#colfenors-urn-decree-of-pain) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Wall of Roots, Devoted Druid, Tree of Redemption, Tree of Perdition](#wall-of-roots-devoted-druid-tree-of-redemption-tree-of-perdition) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Weathered Sentinels](#weathered-sentinels) | rules call | The Tarkir precons, first half: costs, cycling, graveyard statics, edicts |
| [Tasigur, the Golden Fang, Colossal Grave-Reaver](#tasigur-the-golden-fang-colossal-grave-reaver) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Selvala's Stampede](#selvalas-stampede) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Gix, Yawgmoth Praetor](#gix-yawgmoth-praetor) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Lethal Scheme](#lethal-scheme) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Necropolis Fiend, Moorland Haunt](#necropolis-fiend-moorland-haunt) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Shigeki, Jukai Visionary](#shigeki-jukai-visionary) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Steward of the Harvest](#steward-of-the-harvest) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Sepulchral Primordial, Diluvian Primordial](#sepulchral-primordial-diluvian-primordial) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Combustible Gearhulk](#combustible-gearhulk) | new decision | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Dauthi Voidwalker](#dauthi-voidwalker) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Territorial Hellkite, Scourge of the Throne](#territorial-hellkite-scourge-of-the-throne) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Opportunistic Dragon](#opportunistic-dragon) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Chandra's Ignition, Arachnogenesis](#chandras-ignition-arachnogenesis) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Baloth Prime, Pugnacious Hammerskull, Junk Winder](#baloth-prime-pugnacious-hammerskull-junk-winder) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Neriv, Crackling Vanguard](#neriv-crackling-vanguard) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Living Death](#living-death) | rules call | The Tarkir precons, second half: void counters, votes, X costs, "as long as" |
| [Reckless Impulse, Bloodbraid Elf, Ulamog, the Ceaseless Hunger, Pako, Arcane Retriever](#reckless-impulse-bloodbraid-elf-ulamog-the-ceaseless-hunger-pako-arcane-retriever) | animation | Exiling from the top of a library |
| [Tribute to the World Tree, Secure the Wastes, Thalisse, Reverent Medium, Simic Ascendancy, Basri's Solidarity](#tribute-to-the-world-tree-secure-the-wastes-thalisse-reverent-medium-simic-ascendancy-basris-solidarity) | rules call | Token stacks folding back |
| [Trostani, Selesnya's Voice](#trostani-selesnyas-voice) | new decision | Choices on resolution: populate, amass, sacrifice-then |
| [Saruman, the White Hand, Changeling Outcast](#saruman-the-white-hand-changeling-outcast) | new decision | Choices on resolution: populate, amass, sacrifice-then |
| [Wick, the Whorled Mind](#wick-the-whorled-mind) | new decision | Choices on resolution: populate, amass, sacrifice-then |
| [Breena, the Demagogue](#breena-the-demagogue) | new decision | Choices on resolution: populate, amass, sacrifice-then |
| [Abdel Adrian, Gorion's Ward](#abdel-adrian-gorions-ward) | new decision | Choices on resolution: populate, amass, sacrifice-then |
| [Ziatora, the Incinerator, Felothar, Dawn of the Abzan](#ziatora-the-incinerator-felothar-dawn-of-the-abzan) | new decision | Choices on resolution: populate, amass, sacrifice-then |

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

## Mana abilities: colours chosen, lands' types, doubling (2026-10-03, third round)

### Nykthos, Shrine to Nyx, Nyx Lotus

*New decision* — 971565cd (add-mana extensions: devotionTo "that-color")

- **Setup:** Your precombat main, 2-player. Your battlefield, all untapped and not summoning sick:
  Nykthos, Shrine to Nyx; Gray Merchant of Asphodel ({3}{B}{B}); Deathrite Shaman ({B/G}); Kinnan,
  Bonder Prodigy ({G}{U}); 3 Islands. Separately (or afterwards) Nyx Lotus, untapped. In hand: a
  second Gray Merchant of Asphodel. Optional extension: Mana Reflection and/or Mirari's Wake on your
  battlefield.
- **Do:** 1) Click Nykthos and read its ability menu. 2) Pick the black entry. 3) Undo/reset, then
  with only 3 Islands untapped look at whether the Gray Merchant in hand is offered for casting, and
  cast it. 4) Cast or put another devotion permanent onto the battlefield and re-open Nykthos's
  menu. 5) Tap Nyx Lotus by hand. 6) With Mana Reflection (and then also Mirari's Wake) out, tap
  Nykthos for black again.
- **Check:** (1) Nykthos lists its plain '{T}: Add {C}.' plus ONE entry per colour that has
  devotion, in WUBRG order, then ONE '(add no mana)' entry for all the zero-devotion colours (W and
  R here): '...(add {U})', '...(add {B}{B}{B})', '...(add {G}{G})', '...(add no mana)'. The hybrid
  {B/G} on Deathrite counts once for black AND once for green (rule 700.5 / Nykthos ruling). Nykthos
  has no mana cost so adds no devotion of its own. (2) The {2} is paid by two Islands (Nykthos is
  tapped as part of the cost, never paying itself), pool shows {B}{B}{B}, no stack (it's a mana
  ability per the ruling). (3) The second Gray Merchant IS castable from 3 Islands + Nykthos: two
  Islands pay Nykthos's {2} for black (devotion 3 -> {B}{B}{B}), the third Island pays the rest. (4)
  The menu's numbers update straight away for the new board (they are cached per region — a stale
  count is a bug). (5) Nyx Lotus enters tapped if cast; tapped by hand it shows the same per-colour
  menu with no {2} cost; its own {4} adds no devotion. (6) Mana Reflection doubles Nykthos's
  devotion mana ({B}x6 for devotion 3; rule 106.12b — it's a {T} mana ability); Mirari's Wake adds
  one more {B} on top that is NOT doubled (Nykthos is a land; the Mana Reflection ruling excludes
  triggered mana abilities).
- **Known limits:** The floating-pool pips show type and count only. Colours with zero devotion are
  deliberately collapsed into one '(add no mana)' entry rather than five.

### Three Tree City

*New decision* — 971565cd (ofChosenType count, any-color amount)

- **Setup:** Your precombat main. Three Tree City in hand (so its 'as it enters, choose a creature
  type' prompt fires; if the scenario builder places it directly, make sure a type is set).
  Battlefield: two Grizzly Bears, one Llanowar Elves, two untapped Swamps.
- **Do:** Play Three Tree City, choose Bear. Next turn (or untap it), click it and pick the red
  entry of its second ability.
- **Check:** Creature-type prompt appears on entry. The menu shows '{T}: Add {C}.' plus FIVE entries
  for the {2},{T} ability, each making two of one colour ('(add {W}{W})' ... '(add {G}{G})') — the
  colour is free, not tied to the Bears' colour; the Elf isn't counted. Picking red taps the two
  Swamps for the {2} and adds {R}{R}. With no creature of the chosen type, the ability should offer
  only '(add no mana)'.

### Mox Amber, The Grey Havens, Plaza of Heroes, Bloom Tender, Faeburrow Elder

*New decision* — 971565cd (colorAmong / eachColorAmong)

- **Setup:** Your precombat main. Battlefield (yours): Mox Amber, The Grey Havens, Plaza of Heroes,
  Bloom Tender, Faeburrow Elder (both untapped, not summoning sick), Llanowar Elves, Grizzly Bears.
  Opponent: Teysa Karlov, Savannah Lions. Your graveyard: Grizzly Bears, then later Teysa Karlov.
  Opponent's graveyard: Kinnan, Bonder Prodigy. Spells in hand: a legendary creature and a
  nonlegendary spell.
- **Do:** Read each menu, then put Teysa Karlov (W/B legendary) onto YOUR battlefield and a Teysa
  card into your graveyard and read again. Tap Bloom Tender and Faeburrow Elder. Tap Plaza's
  'legendary spell' ability and try to spend the mana on each spell.
- **Check:** Before Teysa: Mox Amber '(add no mana)' (Elves/Bears aren't legendary, the opponent's
  Teysa isn't yours); Grey Havens' coloured ability '(add no mana)' (opponent's graveyard Kinnan
  doesn't count). After: Mox Amber and Plaza's 'among legendary permanents' each offer {W} and {B} —
  ONE mana of one of those colours, not one of each (Mox Amber ruling). Grey Havens offers {W}/{B}.
  Faeburrow Elder alone is 2/2 (its own G and W) and becomes 3/3 with Teysa; Bloom Tender and Elder
  tap with NO prompt for {W}{B}{G} — one per colour, lands colourless and never {C} (Bloom Tender
  rulings); Bloom Tender alone makes just {G}. Plaza's restricted mana pays only the legendary
  spell.
- **Known limits:** Faeburrow Elder is in the Abzan Armor precon (its stand-in was removed), so it
  appears in bot games. The pool display does not show Plaza's spend restriction — test it by trying
  to spend.

### Chrome Mox

*New decision* — 971565cd (look-and-choose destination "exile", imprint link rule 607.2a)

- **Setup:** Your precombat main. Hand: Chrome Mox, Izzet Charm (U/R instant), Sol Ring (artifact),
  a Forest (land), Kozilek's Channeler (colourless, nonartifact), Boomerang; an Island untapped for
  Boomerang (plus {U}).
- **Do:** Cast Chrome Mox; on the imprint trigger exile Izzet Charm; tap the Mox. Then Boomerang the
  Mox, recast it and this time exile Kozilek's Channeler (or decline).
- **Check:** The prompt is titled 'Choose a card to exile' and offers ONLY Izzet Charm and Kozilek's
  Channeler (no Sol Ring, no Forest), and it can be declined (min 0). The Charm goes to exile FACE
  UP. The Mox's menu offers {U} or {R} (one of the exiled card's colours, your pick each tap —
  ruling), never {C}. After bouncing and recasting, the Mox is a new object (rule 400.7): the old
  Charm stays exiled but is no longer linked; with Channeler imprinted (colourless) or nothing
  imprinted the Mox shows '(add no mana)' (2025 rulings: a colourless card gives no mana, never
  {C}).

### Mirari's Wake, Zendikar Resurgent, Fertile Ground, Utopia Sprawl

*New decision* — 971565cd (triggered mana ability picks, extras carry no restriction)

- **Setup:** Your precombat main. Battlefield: Mirari's Wake, Azorius Chancery (untapped), Forest,
  Ancient Ziggurat, Grizzly Bears. In hand: Savannah Lions, Swords to Plowshares, Fertile Ground,
  Utopia Sprawl, and lands to cast them. Later swap Mirari's Wake for Zendikar Resurgent and keep a
  creature spell in hand.
- **Do:** Click Azorius Chancery and read the menu, pick the second entry. Cast Savannah Lions using
  only Ancient Ziggurat (let the auto-payer pay), then look at the pool and cast Swords to
  Plowshares. Cast Fertile Ground on the Forest and tap the Forest by hand. Cast Utopia Sprawl (try
  to target a non-Forest), name blue, tap its Forest. With Zendikar Resurgent, cast a creature
  spell.
- **Check:** Chancery shows two entries, '(add {W}{U}{W})' and '(add {W}{U}{U})' — which type the
  extra is, is your pick (Mirari's Wake ruling); picking the second leaves {W}{U}{U}. Bears are 3/3
  under the Wake. Casting Lions off Ziggurat leaves one floating mana (the Wake's) that is NOT
  creature-only (ruling: restrictions/riders don't carry) — Swords to Plowshares can be cast with
  it. Fertile Ground on Forest: five entries, one per extra colour, and the pool gets {G} + the
  chosen colour. Utopia Sprawl can only target a Forest, asks for a colour as it enters, and the
  Forest then adds {G}{U} with no further prompt — for the auto-payer too (a lone enchanted Forest
  pays {1}{U}). Zendikar Resurgent doubles a Forest to {G}{G} and draws a card when you cast a
  creature spell.
- **Known limits:** The pool pips don't show restrictions; test by spending. Fertile Ground on a
  land that already has a choice (City of Brass) lists one entry per combination — expect a long
  menu.

### Kinnan, Bonder Prodigy

*New decision* — 971565cd (nonland tapped-for-mana extra, 'produced' pick)

- **Setup:** Your precombat main (Commander or 2-player). Battlefield: Kinnan (untapped), Azorius
  Signet, Swamp, a Treasure token, Birds of Paradise (not summoning sick), Sol Ring, Forest, Chrome
  Mox with nothing imprinted. 7 lands total including a Forest and an Island for the {5}{G}{U}.
  Library top five: include Grizzly Bears (non-Human) and a Human creature.
- **Do:** Tap each mana source by hand and read its menu. Then activate Kinnan's {5}{G}{U}.
- **Check:** Forest: just {G} (Kinnan ignores lands). Signet: two entries, three mana each (Signet's
  {W}{U} + an extra {W} or {U}); the Swamp pays the {1}. Treasure: five entries, sacrificed, two of
  the chosen colour. Birds: five entries each '(add {X}{X})'. Sol Ring: {C}{C}{C}. Chrome Mox with
  nothing: no mana and no Kinnan extra (rule 106.12a). The look ability shows the top five, offers
  only non-Human creature cards (may choose none), puts the pick onto the battlefield and the rest
  on the bottom in random order. Kinnan + Llanowar Elves alone casts Grizzly Bears (auto-payer
  counts the extra). The extra mana has no restriction of the tapped permanent (ruling).

### Deathrite Shaman

*New decision* — 971565cd (mana chosen as a stack ability resolves, rule 608.2d)

- **Setup:** Precombat main, 2-player. You: Deathrite Shaman (not summoning sick), Swamp, Forest, a
  Grizzly Bears card in hand ({1}{G}) and only one other land untapped. Opponent's graveyard: one
  Forest card, one Lightning Bolt, one creature card. Opponent also controls a Deathrite Shaman (for
  the response).
- **Do:** Activate the first ability targeting the land card; let the opponent respond with their
  Deathrite targeting the same land card; then do it again uncontested and pick red. Also try
  casting Grizzly Bears and see whether Deathrite is tapped for it. Use the {B} and {G} abilities.
- **Check:** Activation offers NO colour (not a mana ability — it targets, rule 605.5a); it goes on
  the stack. Uncontested: on resolution a prompt 'Deathrite Shaman — choose one' with five buttons
  'Add {W}.' ... 'Add {G}.'; picking red exiles the land and adds {R}. Contested: the opponent's
  resolves first, yours then has an illegal target and does NOTHING — no colour prompt, no mana
  (ruling). The auto-payer never taps Deathrite to pay for Bears. {B} ability: exiles the instant,
  each opponent loses 2; {G}: exiles the creature, you gain 2.

### Culling Ritual, Burnt Offering

*New decision* — 971565cd ("in any combination" split asked on resolution)

- **Setup:** Precombat main. You: Swamp, Forest, two more lands, Llanowar Elves, Darksteel Relic
  (indestructible, MV 0), Gray Merchant of Asphodel; Culling Ritual and Burnt Offering in hand.
  Opponent: Grizzly Bears, two Soldier tokens (Raise the Alarm), Gray Merchant of Asphodel, a land.
- **Do:** Cast Culling Ritual, pick a split. Reset; cast Burnt Offering sacrificing your Gray
  Merchant (MV 5) and pick a split; cast it again sacrificing a token.
- **Check:** Culling Ritual destroys Elves, Bears and both tokens (4) but not Relic, either
  Merchant, or lands; then ONE prompt with five buttons 'Add {B}{B}{B}{B}.' ... 'Add {G}{G}{G}{G}.'
  — mixing allowed (ruling). The mana can be spent this main phase. Burnt Offering: the sacrifice is
  chosen as you cast it; on resolution six buttons from 'Add {B}{B}{B}{B}{B}.' to 'Add
  {R}{R}{R}{R}{R}.' (MV read from the sacrificed creature as it last existed). A token (MV 0) gives
  no prompt and no mana.
- **Known limits:** Up to 35 splits are shown as one choice (so about 34 destroyed permanents is a
  row of 35 buttons); beyond that each unit's colour is asked one at a time. Selvala and Cascading
  Cataracts remain unimplemented for this reason.

### Klauth, Unrivaled Ancient

*New decision* — 971565cd (per-unit colour prompts, spendOnly spells, persists)

- **Setup:** Your precombat main, 2-player. Klauth on the battlefield (haste), Grizzly Bears (not
  summoning sick), an untapped Mountain and Lightning Bolt in hand, Mind Stone, and a cheap spell in
  hand for the second main phase.
- **Do:** Attack with Klauth and Bears. With the trigger on the stack, Bolt your own Bears. Answer
  the colour prompts. Move on to postcombat main; try Mind Stone's draw ability using only the
  floating mana, then cast the spell. Pass to the end step and the next turn.
- **Check:** The trigger goes on the stack (not a mana ability — ruling) and X is read on
  resolution: after the Bolt it's 4 (Klauth only), not 6. Four sequential 'Klauth, Unrivaled Ancient
  — choose one' prompts of five buttons each (70 splits is too many to list), producing exactly what
  you picked. The mana stays through combat into postcombat main, can cast a spell, can't pay an
  ability (Mind Stone's draw isn't payable with it), and is gone by the next turn.
- **Known limits:** The prompt for each unit looks the same and may not show how many remain. The
  pool pips don't show the spells-only restriction.

### Gwenna, Eyes of Gaea

*New decision* — 971565cd (two mana in any combination, by hand; creature-source restriction)

- **Setup:** Precombat main. Gwenna (untapped, not summoning sick), Deathrite Shaman (not summoning
  sick), Nykthos, five other lands including two Forests; opponent graveyard holds an instant card.
  Hand: Alpha Tyrranax (6/5, {4}{G}{G}), Gray Merchant of Asphodel, a noncreature spell.
- **Do:** Open Gwenna's menu and pick {B}{G}; try to spend it on the noncreature spell, on Nykthos's
  {2}, and on Deathrite's {B},{T} ability. Then cast Gray Merchant, and later Alpha Tyrranax using
  Gwenna's mana.
- **Check:** The menu lists 15 entries (each two-mana combination), and is readable. The mana can't
  pay the noncreature spell or Nykthos's {2}, but CAN pay Deathrite's {B} ability (a creature
  source, rule 109.2a). Casting Gray Merchant (power 2) does nothing; casting Alpha Tyrranax (power
  6) puts a +1/+1 counter on Gwenna and untaps her.
- **Known limits:** The pool pips don't show the restriction.

### Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve

*Rules call* — 971565cd (producedBy your-lands / anyType, rule 106.7)

- **Setup:** Your precombat main. Step A: Reflecting Pool (untapped), a TAPPED Forest, Reliquary
  Tower; opponent controls a Mountain. Step B: add a second Reflecting Pool, then remove the Forest
  and Tower so only the two Pools remain. Step C: add Exotic Orchard; opponent controls a Swamp.
  Step D: Incubation Druid + Spire of Industry with NO artifact you control + Vivid Grove with 0
  charge counters; Druid untapped, not summoning sick; 5 lands for adapt. Step E: Gond Gate + a
  Forest; Azorius Guildgate in hand. Optional (Commander game with Klauth, Unrivaled Ancient as
  commander in the command zone): Cactus Preserve + 3 lands; Horizon of Progress + Forest +
  Reliquary Tower.
- **Do:** Open each permanent's ability menu at each step. Tap Reflecting Pool for {C} in step A. In
  D, read the Druid's menu, activate adapt ({3}{G}{G}), read the menu again. In E, play Azorius
  Guildgate. Optional: activate Cactus Preserve's {3}; tap Horizon of Progress for mana.
- **Check:** A: Pool offers exactly {G} and {C} — a tapped land counts, colorless is a type (rule
  106.1b), the opponent's Mountain gives nothing. B: two Pools alone offer one '(add no mana)' entry
  and can still be tapped for nothing (ruling: multiple Reflecting Pools won't help each other). C:
  Pool now offers {B} (it reads through Exotic Orchard, which reads the opponent's Swamp). D: Druid
  offers all five colours — Spire's 'activate only if you control an artifact' and Vivid Grove's
  counter cost are ignored (Incubation Druid / Reflecting Pool rulings: costs and legality aren't
  checked); after adapt (three +1/+1 counters) each entry makes THREE of ONE type ('(add
  {G}{G}{G})'), never a mix; adapt with counters already on does nothing. E: Gond Gate's colour
  ability is '(add no mana)' with only a Forest (it reads Gates, not its own colours); Azorius
  Guildgate enters UNTAPPED, then Gond offers {W}/{U}. Optional: Cactus Preserve becomes a 7/7 green
  Plant land creature with reach (Klauth's MV 7, read from the command zone); Horizon of Progress
  costs 1 life per mana tap and offers {G} and {C}. None of these carry the other land's
  restrictions or riders.
- **Known limits:** Two Reflecting Pools alone making nothing is intentional (the 2008 ruling), not
  a bug.

### Reflecting Pool, The Grey Havens, Chrome Mox, Mox Amber, Wild Growth, Fertile Ground, Kinnan, Bonder Prodigy, Mirari's Wake

*Rules call* — fbeec5f8 (review: tapped for no mana sets off no 'tapped for mana' trigger)

- **Setup:** Your precombat main. A lone Reflecting Pool (no other lands) with Wild Growth attached;
  The Grey Havens with Fertile Ground attached and no legendary creature card in your graveyard;
  Mirari's Wake on the battlefield. Separately: Kinnan, Bonder Prodigy and a Chrome Mox with nothing
  imprinted, and Mox Amber with no legendary creature or planeswalker.
- **Do:** Click each of Reflecting Pool, The Grey Havens (its coloured ability), Chrome Mox and Mox
  Amber; read the menu; activate the no-mana entry.
- **Check:** Each shows a single '(add no mana)' entry for that ability (no five-colour list from
  Fertile Ground, no Wild Growth {G}, no Mirari's Wake / Kinnan extra), the permanent taps, and the
  pool stays EMPTY. Rule 106.12a: 'whenever ... is tapped for mana' triggers only when the mana
  ability actually produces mana. The Grey Havens' plain {T}: Add {C} still works normally and does
  set off Fertile Ground (then a colour is offered).
- **Known limits:** Before this fix, tapping a no-mana list by hand still produced the Aura's extra
  mana — report any recurrence.

### Mana Flare, Heartbeat of Spring

*Rules call* — 971565cd (tapped-for-mana who: any, extra to whoever tapped)

- **Setup:** 2-player (both seats driven by you). Opponent controls Mana Flare (or Heartbeat of
  Spring). You: Forest, Azorius Chancery, Cavern of Souls (naming a type), Grizzly Bears in hand.
  Opponent: a Mountain and a 2-mana red spell in hand.
- **Do:** On your turn tap the Forest by hand; tap the Chancery; cast Grizzly Bears off one Forest
  only. On the opponent's turn, have them tap their Mountain and cast their spell from one land.
- **Check:** Your Forest gives YOU {G}{G} even though the enchantment is the opponent's; the
  opponent's pool is untouched. Chancery shows two entries ({W}{U} + a {W} or {U} of your pick —
  ruling: if the land made more than one type you choose one). One Forest pays {1}{G} for the Bears
  (the auto-payer counts the extra). The opponent's Mountain gives them {R}{R}. Cavern's extra mana
  has no type restriction and doesn't make a spell uncounterable (ruling). Heartbeat of Spring
  behaves identically.

### Mana Reflection, Nyxbloom Ancient

*Rules call* — 971565cd (tap-for-mana multiplier, rule 106.12b)

- **Setup:** Your precombat main. Battlefield: Mana Reflection; a Forest with Wild Growth attached;
  Birds of Paradise (not summoning sick); Gilded Lotus; Ancient Ziggurat; a plain Forest. In hand:
  Plated Seastrider ({U}{U}), Expressive Iteration ({U}{R}), a noncreature spell. Later add a second
  Mana Reflection and Nyxbloom Ancient. Opponent controls their own Mana Reflection in a second
  setup.
- **Do:** Tap the Wild-Growth Forest; open Birds' menu; tap Gilded Lotus; tap Ancient Ziggurat by
  hand and try to spend the result on the noncreature spell; check what one Birds can cast. Add the
  second Reflection + Nyxbloom and tap the plain Forest. Second setup: only the OPPONENT has Mana
  Reflection; tap your Forest.
- **Check:** Wild-Growth Forest: {G}{G}{G} — the Forest's own {G} doubled, Wild Growth's not
  (ruling: triggered mana abilities aren't affected). Birds: five entries each '(add {G}{G})' style
  — two of ONE colour, never a mix. Gilded Lotus: six of one colour. Ziggurat: two mana, BOTH
  creature-only (ruling: restrictions apply to all mana produced). One Birds can pay Plated
  Seastrider but not Expressive Iteration. Two Reflections + Nyxbloom: one Forest = 12 {G} (they
  compound: 2x2x3). The opponent's Mana Reflection does nothing for your Forest.
- **Known limits:** Large amounts show as a count plus one pip in the pool (e.g. '12{G}').

## Library ordering and cards chosen as a cost (2026-10-03, third round)

### Aragorn, the Uniter, Preordain, Opt, Consider

*New decision* — ac416172 (library ordering: every scry/surveil now orders its cards — previously 'keep them as they are')

- **Setup:** Your turn, precombat main. Your battlefield: Aragorn, the Uniter, 2-3 Islands. Hand:
  Preordain, Opt, Consider. Library top (top first): four different cards, e.g. Grizzly Bears, Hill
  Giant, Craw Wurm, Llanowar Elves. Then put two copies of one card (e.g. two Grizzly Bears) on top
  for the last step.
- **Do:** 1) Cast Opt: Aragorn's blue trigger (scry 2) goes on the stack above Opt and resolves
  first. In the scry prompt keep both on top. 2) Cast Preordain, send both cards to the bottom. 3)
  Cast Preordain/scry again sending one to the bottom and keeping one. 4) Cast Consider (surveil 1)
  / any surveil 2+ keeping two. 5) With two copies of one card on top, scry 2 keeping both.
- **Check:** Step 1: after the scry prompt a second popup titled 'Put them back on top in the order
  you pick: the first you pick goes on top' appears, picks are numbered, you must pick both (rule
  701.22a); the first pick ends on top. Then Opt's own scry 1 asks no order. Step 2: a popup titled
  'Put them on the bottom in the order you pick: the last you pick goes on the very bottom' — the
  last pick is the very bottom card. If cards go both ways, the top order is asked first, then the
  bottom order. Preordain's 'then draw' waits until the order is answered and draws the card you
  picked first for the top. Step 3: one card each way asks no order at all. Step 4: surveil's kept
  cards are ordered the same way (rule 701.25a); cards sent to the graveyard just go there. Step 5:
  copies of one card (same name) ask no order.
- **Known limits:** The order is skipped on purpose for fewer than two cards or cards that all share
  one name. Scroll Rack is not authored (BACKLOG).

### Stock Up, Dig Through Time, Experimental Augury, Growing Rites of Itlimoc // Itlimoc, Cradle of the Sun

*New decision* — ac416172 (look-and-choose leftover 'bottom-any-order')

- **Setup:** Your turn, precombat main, plenty of Islands and Forests untapped. Graveyard: 6+ cards
  (for delve). A creature of yours with a +1/+1 counter (for proliferate). Hand: Stock Up, Dig
  Through Time, Experimental Augury, Growing Rites of Itlimoc. Before each cast, set the library top
  to distinct cards, mixing creatures and noncreatures (e.g. Island, Grizzly Bears, Craw Wurm,
  Lightning Bolt, Opt, Hill Giant, Llanowar Elves). Also have 3 other creatures on your battlefield
  before your end step.
- **Do:** Cast Stock Up (take 2 of 5); Dig Through Time delving 6 (take 2 of 7); Experimental Augury
  (take 1 of 3, then proliferate); Growing Rites (ETB: look at 4, take a creature or none). Then
  reach your end step with Growing Rites and 4 creatures; next turn tap Itlimoc for its second
  ability.
- **Check:** Each spell first asks the pick for your hand (popup not numbered), then a second popup
  'Put them on the bottom in the order you pick: the last you pick goes on the very bottom',
  numbered, requiring every leftover card; the library bottom matches your pick order (rule 401.4).
  Dig: the 6 delved cards are exiled at cast and only 5 are ordered. Augury: the proliferate prompt
  comes only after the order is answered. Growing Rites: only creature cards are selectable in the
  first pick (others shown but not pickable), taking none is allowed and then all 4 are ordered; the
  taken creature is revealed to the opponent (log), the rest are not. With only one leftover, or
  leftovers that are all copies of one card, no order is asked. End step: with 4+ creatures as the
  step begins it transforms into Itlimoc, Cradle of the Sun (a land); with 3 it doesn't trigger, and
  if you drop below 4 before it resolves it does nothing (intervening-if, rule 603.4 and its
  ruling). Itlimoc's second ability adds {G} per creature you control.
- **Known limits:** 'In a random order' cards still use bottom-random (no prompt) — only 'in any
  order' asks.

### Halimar Depths, Sensei's Divining Top

*New decision* — ac416172

- **Setup:** Your turn, main phase. Hand: Halimar Depths. Battlefield: Sensei's Divining Top, one
  untapped land. Library top: three different cards (e.g. Grizzly Bears, Hill Giant, Craw Wurm).
- **Do:** Play Halimar Depths. Then activate Top's {1} ability. Then activate Top's {T} ability.
- **Check:** Halimar Depths enters tapped; its ETB opens 'Put them back on top in the order you
  pick: the first you pick goes on top' with all three cards, numbered, all three required; the
  library top then matches your pick order. Top's {1} does the same. Top's {T}: you draw the current
  top card, then the Top goes onto your library as the new top card (draw first, then Top on top —
  Oracle order); the card you'd put second is now under it.
- **Known limits:** These two always ask even if the three cards are identical (the 'copies of one
  card' skip only applies to scry/surveil and 'the rest on the bottom' orders) — not a bug.

### Valakut Awakening // Valakut Stoneforge

*New decision* — ac416172 (look-and-choose destination 'library-bottom' from a hand)

- **Setup:** Your turn, main phase, 3 Mountains. Hand: Valakut Awakening plus three distinct cards
  (e.g. Grizzly Bears, Hill Giant, Craw Wurm). A second Valakut Awakening in hand for the land test.
- **Do:** Cast Valakut Awakening and pick two of the three hand cards. Cast again picking none. Then
  play the second copy as its land face, Valakut Stoneforge.
- **Check:** As it resolves (not on cast — its ruling) a popup 'Choose ... to put on the bottom of
  your library, in order: the last you pick goes on the very bottom' offers 0 to all hand cards,
  picks numbered; the bottom of the library matches the pick order. Two put there: you draw three
  (that many plus one). None put there: you draw one (its ruling). The land face can be played from
  hand as a land, enters tapped, taps for {R}.

### Teferi's Puzzle Box

*New decision* — ac416172 + c43ff463 (two Boxes tested)

- **Setup:** Two-player game. Your battlefield: Teferi's Puzzle Box (later add a second one).
  Opponent's hand: 2 distinct cards. Start on your turn and pass to the opponent's turn.
- **Do:** Let the opponent reach their draw step. As the opponent, answer the prompt. Then repeat
  with two Puzzle Boxes on the battlefield. Also let it trigger in your own draw step.
- **Check:** The opponent first makes their normal draw (its ruling), then is asked to put every
  card in hand (3) on the bottom in pick order — the popup must require all of them, picks numbered,
  title '... in order: the last you pick goes on the very bottom'; then they draw 3. The library
  bottom matches their pick order. Your seat only sees that the opponent is choosing ('look at
  cards') and never sees their hand cards. It triggers for each player's draw step, yours included.
  With two Boxes, it happens twice, separately (its ruling).
- **Known limits:** 'That many' is the number of cards actually put on the bottom: a commander sent
  to the command zone instead (see the 903.9b entry) is not counted, so one fewer card is drawn.

### Valakut Awakening, Teferi's Puzzle Box, Brainstorm

*New decision* — c43ff463 (review: a commander put from a hand into a library is offered the command zone, rule 903.9b)

- **Setup:** Commander game. Your commander is in your hand (not the command zone) with one other
  card, e.g. Hill Giant. 3 Mountains and an Island untapped. Hand also: Valakut Awakening,
  Brainstorm. For the Puzzle Box part: Puzzle Box on your battlefield and the opponent's commander
  in their hand with one other card.
- **Do:** 1) Cast Valakut Awakening, pick Hill Giant and your commander; answer 'Command zone'. 2)
  Repeat, answering 'Put into library'. 3) Cast Brainstorm, put back Hill Giant and the commander
  (both answers). 4) Let the opponent's draw step come with Puzzle Box out.
- **Check:** After you confirm the picks and before anything moves (both cards still in hand), a
  prompt '<commander> would go to your library — move it to the command zone instead?' with buttons
  'Command zone' / 'Put into library' (rule 903.9b). 1) Commander goes to the command zone, Hill
  Giant to the bottom, you draw 2 (one put there + 1). 2) Both go to the bottom in pick order and
  you draw 3. 3) Brainstorm: kept for the library it goes back on top where you picked it; to the
  command zone, Hill Giant alone is put on top. 4) The opponent (not you) gets the prompt for their
  commander; choosing the command zone, they redraw one fewer card.
- **Known limits:** BACKLOG: a commander put into a library from a graveyard, exile or the stack
  (e.g. Noxious Revival on a commander left in a graveyard) still isn't offered the command zone.

### Moorland Haunt, Mines of Moria, Varina, Lich Queen, Psychic Frog, Drivnod, Carnage Dominus

*New decision* — ac416172 (cost: exile N cards from your graveyard, exileFromGraveyard)

- **Setup:** Your turn, main phase. Battlefield: Moorland Haunt + Plains + Island; Mines of Moria +
  4 Mountains; Varina, Lich Queen + 2 lands; Psychic Frog; Drivnod, Carnage Dominus + 2 Swamps.
  Graveyard: a Wastes, Grizzly Bears, Hill Giant, Craw Wurm and 3 more noncreature cards. For the
  Mines entry test, have Mines of Moria in hand and test once with no legendary creature and once
  with Varina out.
- **Do:** Activate Moorland Haunt's Spirit ability; Mines' Treasure ability; Varina's Zombie
  ability; Frog's flying ability; Drivnod's counter ability (pay one {B/P} with life). Also try
  Moorland Haunt with only one creature card in the graveyard, and with none. Play Mines of Moria
  from hand with and without a legendary creature.
- **Check:** The ability goes on the stack, then a popup 'Choose N card(s) to exile' shows your
  whole graveyard but only matching cards are pickable (Haunt and Drivnod: creature cards only; the
  Wastes visible but not pickable); exactly the count is required. The cards are exiled right away,
  before the ability resolves (rule 602.2b), all at once. With exactly as many matching cards as the
  cost, they're exiled without asking; with too few the ability isn't offered. Results: Spirit 1/1
  flier; two Treasures; a TAPPED 2/2 Zombie; Frog gains flying until end of turn; an indestructible
  counter on Drivnod. Opponent sees you're choosing but can't answer. Mines enters tapped without a
  legendary creature already on the battlefield, untapped with Varina out (one entering at the same
  time doesn't count — its ruling); a second Mines triggers the legend rule.
- **Known limits:** AUTHORING: exileFromGraveyard isn't supported on a mana ability or beside a
  discard / multi-sacrifice cost; a SPELL's additional 'exile a card from your graveyard' cost isn't
  built.

### Key to the City, Ghostly Pilferer

*New decision* — ac416172 + c43ff463 (becomes-untapped trigger, rule 701.26b)

- **Setup:** Your turn. Battlefield: Key to the City, Ghostly Pilferer (not summoning sick), Grizzly
  Bears, 4 lands, Voltaic Key. Hand: 3 cards. Optional: an 'at the beginning of your upkeep' trigger
  card and Settings → 'Order my own triggers' on.
- **Do:** 1) Activate Key ({T}, discard) targeting Grizzly Bears; activate again later with 'Skip'
  for no target. 2) Attack with Pilferer to tap it. 3) Pass to your next turn. 4) Mid-turn, tap Key
  and untap it with Voltaic Key. 5) Activate Pilferer's 'Discard a card'.
- **Check:** 1) Key's target step has a Skip button (up to one target — its ruling); Bears can't be
  blocked this turn. 3) Both untap in your untap step, but the triggers go on the stack only in the
  upkeep, together with upkeep triggers (rule 502.4; their rulings) — with the ordering setting on
  you can order them among the upkeep triggers. Each asks 'Pay {2} to draw a card?' Yes/No; Yes is
  only offered if you can pay {2}, paying once draws exactly one. 4) Untapping by an effect fires it
  too. 5) Pilferer becomes unblockable this turn (activating after it's blocked doesn't unblock it).
- **Known limits:** Trigger ordering is only asked with Settings → 'Order my own triggers' on;
  otherwise the engine's order is used.

### Sensei's Divining Top

*Rules call* — ac416172

- **Setup:** Your turn, main phase. Battlefield: Sensei's Divining Top (untapped), one untapped
  land. Opponent: a bounce spell (e.g. Unsummon) and a blue source. Library: distinct cards on top.
- **Do:** A) Activate Top's {1}; with it on the stack, activate {T} in response. Let both resolve.
  B) Activate {T}; the opponent responds by bouncing the Top to your hand with Unsummon.
- **Check:** A) {T} resolves first: you draw, Top goes on top of the library; then the {1} resolves
  and the Top itself is among the three cards you look at and order (its ruling). B) You still draw
  a card, and the Top stays in your hand — it is not put on the library (its ruling; rule 400.7,
  it's a new object).

### Psychic Frog, Moorland Haunt, Thrill of Possibility, Nezahal, Primal Tide

*Rules call* — ac416172 + c43ff463 (rule 117.3c: a cost's choice hands priority back to whoever activated/cast)

- **Setup:** Opponent's turn (their upkeep or combat). Your battlefield: Psychic Frog, Moorland
  Haunt + Plains + Island, two Mountains. Your hand: 3+ cards including Thrill of Possibility.
  Graveyard: two creature cards.
- **Do:** When you get priority on the opponent's turn: activate Frog's 'Discard a card' and pick
  the card. Then activate Moorland Haunt and pick the creature card. Then cast Thrill of Possibility
  and pick its additional discard.
- **Check:** After each cost choice you still hold priority (your Pass/act controls shown, the
  opponent is not prompted) with the ability/spell on the stack (rule 117.3c) — e.g. you can
  activate Frog a second time before anything resolves. Previously the discard cost handed priority
  to the active player.

### Mesmeric Orb

*Rules call* — ac416172 + c43ff463

- **Setup:** Two-player. Your battlefield: Mesmeric Orb. Opponent: 3 tapped lands and a tapped stack
  of 5 Soldier tokens at the end of your turn; Steam Vents in their hand. Also give yourself a
  creature you stole from the opponent (gain control) and a tapped Grizzly Bears.
- **Do:** 1) Pass to the opponent's turn. 2) On their turn they play Steam Vents paying 2 life. 3)
  Untap one token out of a tapped stack with an untap effect. 4) Untap your stolen creature with an
  effect and bounce it to its owner's hand before the Orb trigger resolves.
- **Check:** 1) In their upkeep (not untap step), 8 Orb triggers resolve and the opponent mills 8 —
  3 lands + 1 per token in the stack (each token is its own permanent); you mill nothing. 2) Steam
  Vents entered untapped — no mill (rule 614.1c; it never untapped). 3) One token untapped = one
  mill. 4) The mill goes to whoever controlled it as it last was on the battlefield (you), not its
  owner.
- **Known limits:** BACKLOG: the mirror case — a token stack becoming TAPPED fires 'becomes-tapped'
  only once (e.g. Magda) — is still open; not this card.

### Aragorn, the Uniter

*Rules call* — ac416172

- **Setup:** Your turn, main phase. Battlefield: Aragorn, the Uniter, Grizzly Bears, Mountains,
  Plains, Forests. Hand: Lightning Bolt, Giant Growth, Boros Charm, Swords to Plowshares. Optional:
  a 3-4 player game and Settings → 'Order my own triggers' on.
- **Do:** Cast Lightning Bolt at an opponent; Giant Growth on Bears; Boros Charm (4 damage mode) at
  an opponent.
- **Check:** Bolt: Aragorn deals 3 to target opponent (in multiplayer you choose which opponent;
  can't target yourself) on top of the Bolt's 3. Giant Growth: Aragorn's green trigger asks a target
  creature; Bears ends 2+3+4 = 9 power. Boros Charm (red and white): two triggers — a 1/1 Human
  Soldier token and 3 damage — and with the ordering setting on you choose their order (its ruling).
  Each trigger resolves before the spell.
- **Known limits:** Order of several Aragorn triggers is only asked with 'Order my own triggers' on.

### Varina, Lich Queen

*Rules call* — ac416172

- **Setup:** Your turn, precombat main. Battlefield: Varina, Lich Queen, Cemetery Reaper (a Zombie),
  Grizzly Bears — none summoning sick. Hand: 1 card. Life known.
- **Do:** Attack with all three. Answer the discard prompt. Optionally, remove one attacking Zombie
  from combat before the trigger resolves.
- **Check:** One trigger for the declaration (not one per Zombie): draw 2, then discard 2 (you
  choose which), gain 2 life — Bears doesn't count, Varina does. A Zombie that left combat before
  resolution still counts, and the discard and life gain equal the number of Zombies even if you
  drew fewer (its rulings).

### Drivnod, Carnage Dominus

*Rules call* — ac416172

- **Setup:** Your turn. Battlefield: Drivnod, Zulaport Cutthroat, Blood Artist, Lightless Evangel,
  Viscera Seer, Grizzly Bears. Opponent at known life.
- **Do:** Sacrifice Grizzly Bears to Viscera Seer.
- **Check:** Zulaport Cutthroat and Blood Artist (death triggers) each trigger twice: opponent loses
  4, you gain 4. Lightless Evangel ('whenever you sacrifice') triggers only once (+1 counter) — it's
  caused by the sacrifice, not the death (its ruling). Viscera Seer's scry 1 happens once (it's a
  cost's ability, not a trigger). Each doubled instance makes its own choices.

### Nezahal, Primal Tide, Ghostly Pilferer

*Rules call* — ac416172

- **Setup:** Commander game, opponent's turn, main phase. Your battlefield: Nezahal, Primal Tide
  (with a +1/+1 counter), Ghostly Pilferer. Your hand: 4 cards. Opponent: lands, Lightning Bolt in
  hand, Faithless Looting in graveyard, their commander in the command zone.
- **Do:** Opponent casts: Lightning Bolt from hand; Faithless Looting by flashback; their commander
  from the command zone. Later, on your own turn's main phase, activate Nezahal (discard three — you
  choose which of the four); separately, activate it during an end step.
- **Check:** Bolt (noncreature, from hand): Nezahal draws, Pilferer doesn't. Looting by flashback:
  both draw. Commander from the command zone (creature, not from hand): Pilferer draws, Nezahal
  doesn't. Each draw trigger resolves before the spell, even if it's countered (rulings). Nezahal's
  blink: exiled at once, back at the beginning of the next end step TAPPED, a new object without the
  +1/+1 counter (its ruling; rule 400.7); activated during an end step, it returns at the next
  turn's end step.

## Infect, wither, spree and gift (2026-10-03, third round)

### Three Steps Ahead

*New decision* — 2cd2d704 (spree)

- **Setup:** 2-player, opponent's turn, their main phase. You: 3 Islands + 3 Swamps untapped, plus
  Grizzly Bears with one +1/+1 counter, tapped. Your hand: Three Steps Ahead and 2 other cards.
  Library: 5+ cards. Opponent: 2 Islands untapped and Divination in hand. Second variant: swap your
  lands for 1 Island + 5 Swamps.
- **Do:** (a) Before the opponent casts anything, open Three Steps Ahead's cast and look at the mode
  chooser, then Cancel. (b) The opponent casts Divination. With priority, cast Three Steps Ahead,
  choose counter + draw, and target Divination. Discard one card when asked. (c) On a later cast,
  choose only the copy mode and target your tapped Bears. (d) With the 1 Island + 5 Swamps lands,
  put a spell on the stack and open the chooser again.
- **Check:** The chooser reads 'Three Steps Ahead — choose 1–N', where N is the largest set you can
  pay for. Each mode button shows its cost with mana symbols. (a) With nothing on the stack,
  'Counter target spell' is greyed out (no legal target, per the ruling); copy + draw together is
  allowed ({U}+{3}+{2}=6). (b) With a spell on the stack and 6 lands: after you pick one mode, the
  other two stay open. After you pick two, the third greys out, because all three cost 9. Confirm
  stays disabled until the picks are a set you can pay for. 5 lands tap, Divination is countered,
  you draw 2 and only then get a discard prompt (modes resolve in printed order, per the ruling).
  (c) The token is an untapped 2/2 Bears with no counter (707.2: copiable values only). (d) Counter
  needs {U}+{1}{U}, two blue, so it is greyed out with one Island even though you have 6 mana.
- **Known limits:** Cascade and suspend cast a spree spell with no modes, so it resolves doing
  nothing (BACKLOG 'Cascade and suspend cast with no modes and no kicker'; AUTHORING §15). Don't
  test it through cascade.

### Insatiable Avarice

*New decision* — 2cd2d704 + review 6017786f (must find a card)

- **Setup:** 2-player, your main phase. You: 5 Swamps (BBB is needed), life 20. Library: 10+
  distinct, recognisable cards. Hand: 2 copies of Insatiable Avarice. Opponent: life 20. Watch the
  opponent's seat on a second screen if you can.
- **Do:** Cast the first copy with both modes ({B}+{2}+{B}{B}=5) and target yourself for the draw.
  Pick a card from the middle of the library. Next turn, cast the second copy with only the second
  mode and target the opponent.
- **Check:** The library search lists every card in your library. You must pick exactly one: there
  is no 'find nothing' option and Confirm needs a card (rule 701.23d, from the review). The library
  shuffles, the chosen card goes on top, and then the draw of three includes it (modes in printed
  order). Your life goes to 17. The opponent's seat and log should not reveal which card you chose.
  Second cast: the opponent draws 3 and goes to 17 life, and your library is untouched. If you cast
  only the first mode, the card ends up on top of your library, not in your hand.
- **Known limits:** Twelve other 'search for a card' tutors (Demonic Tutor, Vampiric Tutor, etc.)
  still let the search find nothing (BACKLOG). Insatiable Avarice is fixed. Cascade and suspend cast
  it with no modes (BACKLOG).

### Smuggler's Surprise

*New decision* — 2cd2d704 (spree)

- **Setup:** 2-player, your turn. You: 9 lands including 2+ Forests. Top 4 of library: Craw Wurm,
  Forest, Sol Ring, Grizzly Bears. Graveyard: an older creature card, e.g. Hill Giant. Hand:
  Smuggler's Surprise and Serra Angel. Battlefield: Grizzly Bears.
- **Do:** Cast it with all three modes ({G}+{2}+{4}{G}+{1}=9). From the milled cards, take Craw Wurm
  and Forest. When mode 2 asks, put Craw Wurm and Serra Angel from your hand onto the battlefield.
- **Check:** The mill pick offers only the creature and land cards milled this way: Craw Wurm,
  Forest and Bears. It does not offer Sol Ring or the older Hill Giant. It allows 0–2 picks. Mode
  2's hand prompt offers only creature cards, including the Craw Wurm mode 1 just returned (modes in
  order). It allows 0–2. Mode 3 gives hexproof and indestructible to the newly entered Craw Wurm
  (6/4) and Serra Angel (4/4), per the ruling. Your 2/2 Bears gets nothing. Any enters triggers wait
  until the spell finishes resolving.
- **Known limits:** Cascade and suspend free casts pick no modes (BACKLOG).

### Requisition Raid

*New decision* — 2cd2d704 (spree, add-counter-all controlledByTarget)

- **Setup:** 3-player, your main phase. You: 4 Plains and two creatures. Opponent B: Sol Ring and a
  creature. Opponent C: Pacifism on one of your creatures, and two creatures of their own.
- **Do:** Cast it with all three modes: target Sol Ring, Pacifism, and yourself as the player.
  Recast (or replay) with only mode 3 targeting C.
- **Check:** The cost is {W}+{1}x3 = 4. Target prompts come in mode order: artifact, then
  enchantment, then player. Any player can be targeted, you included. +1/+1 counters go only on the
  targeted player's creatures. Sol Ring and Pacifism are destroyed.
- **Known limits:** Cascade and suspend free casts pick no modes (BACKLOG).

### Dawn's Truce

*New decision* — 2cd2d704 (gift)

- **Setup:** 4-player game: you plus B, C, D in turn order. Your main phase. You: 4 Plains, Grizzly
  Bears, Sol Ring. Hand: 3 copies of Dawn's Truce. B: Counterspell and UU open. Also repeat in a
  2-player game, and in a 4-player game where one opponent has already lost.
- **Do:** Open the cast options for Dawn's Truce. Cast the gift version: answer No for B and No for
  C. Let it resolve. Cast a second copy promised, answer Yes for B, and have B counter it. Cast a
  third copy unpromised.
- **Check:** There are two cast buttons: 'Cast Dawn's Truce' and 'Cast Dawn's Truce (gift)'. The
  gift button shows no mana symbol, because a gift costs nothing. The promised cast asks 'Dawn's
  Truce — Promise the gift to this opponent? — B' with Yes/No, in turn order from your left. After
  No to B and C, D gets it with no third question. The log reads 'You promise Dawn's Truce's gift to
  D'. On resolution D draws first (702.174j). Then you have hexproof, and every permanent you
  control (lands and Sol Ring too) has hexproof and indestructible until end of turn. Countered: no
  gift card is drawn (ruling). Unpromised: hexproof only and nobody draws. In 2-player there is no
  question at all. An opponent who has lost is never offered, and a promised opponent who leaves
  before resolution gets nothing.
- **Known limits:** Asking about one opponent at a time is a known UI gap. BACKLOG (Client/UI) wants
  a single prompt naming every opponent, so don't report the sequence as a bug. Cascade and suspend
  never offer the gift (BACKLOG).

### Into the Flood Maw, Long River's Pull, Wear Down, Peerless Recycling, Sazacap's Brew

*New decision* — 2cd2d704 (gift, promised targets 702.174m)

- **Setup:** 2-player. You: 2 Islands, 2 Forests, 2 Mountains. Battlefield: Grizzly Bears.
  Graveyard: Grizzly Bears, Sol Ring, Lightning Bolt. Hand: all five cards plus one spare card.
  Opponent: Sol Ring and Rhystic Study, no creatures, and Divination in hand with mana open.
- **Do:** Look at each card's cast options and target lists, then cast each promised. Long River's
  Pull: cast it in response to the opponent's Divination. Wear Down: also try it after one of the
  two targets is gone. Sazacap's Brew: cast it once unpromised with no creature target, and once
  promised targeting a player and your Bears.
- **Check:** Into the Flood Maw: with no opposing creature, only the '(gift)' cast is offered. It
  targets Sol Ring or Rhystic Study, never a land. The opponent gets a tapped 1/1 blue Fish first,
  then the permanent returns to its owner's hand. Long River's Pull: only the gift version can
  target the noncreature Divination. Wear Down: promised needs two different artifacts/enchantments,
  so it isn't offered with only one. With two, both are destroyed together after the opponent draws.
  Peerless Recycling: targets only permanent cards (never the Bolt), and promised takes two
  different ones. Sazacap's Brew: unpromised targets only a player, with no creature needed.
  Promised targets a player plus a creature you control (+2/+0). The discard cost is asked as a
  prompt after you cast. Brew shouldn't be castable when it's your only card in hand (601.2a/h), but
  that case isn't in the tests.
- **Known limits:** Cascade and suspend never offer a gift (BACKLOG). The gift opponent prompt goes
  one opponent at a time in multiplayer (BACKLOG Client/UI).

### Octomancer

*New decision* — 2cd2d704 (gift an Octopus)

- **Setup:** 2-player, your main phase. You: 3 Forests + 2 Islands. Hand: Octomancer. Opponent:
  Raise the Alarm with mana open for their next turn.
- **Do:** Cast Octomancer promised. Go to your end step. On the opponent's turn, have them cast
  Raise the Alarm, then go to their end step. On a turn when no creature token entered, go to the
  end step.
- **Check:** As it enters, the opponent gets an 8/8 blue Octopus token. At your end step, the
  trigger targets 'creature token that entered this turn' and offers the opponent's Octopus. You get
  an untapped 8/8 Octopus copy with no counters (707.2). It triggers at every player's end step: on
  the opponent's turn you can target one of their new Soldiers. On a turn with no new creature
  token, the trigger has no target and does nothing.
- **Known limits:** None documented for this card.

### Final Showdown

*Rules call* — 2cd2d704 (spree, lose-abilities-all)

- **Setup:** 2-player, your main phase. You: 8 Plains. Battlefield: Grizzly Bears and Doomed
  Traveler. Opponent: Darksteel Myr (indestructible) and Doomed Traveler. Hand: 2 copies of Final
  Showdown.
- **Do:** Cast it with all three modes ({W}+{1}+{1}+{3}{W}{W}=8). When asked, choose your Grizzly
  Bears. Next turn, cast the second copy with only the first mode.
- **Check:** The second mode asks 'Choose a creature you control to gain indestructible until end of
  turn' during resolution, as a choice rather than a target (per the ruling). It offers only your
  creatures. Bears survives: indestructible granted after the 'lose all abilities' effect is kept
  (613.7, the ruling). Darksteel Myr is destroyed because it lost indestructible. Neither Doomed
  Traveler makes a Spirit: they had no abilities when they died (603.10a look-back). That last point
  follows from the rules but isn't in this pass's tests. With mode 1 alone, the Myr shows no
  indestructible icon until end of turn and has it again next turn.
- **Known limits:** None documented for this card. Cascade and suspend free casts pick no modes
  (BACKLOG).

### Parting Gust

*Rules call* — 2cd2d704 (gift)

- **Setup:** 2-player, your main phase 1. You: 4 Plains and Wall of Omens. Hand: 2 copies of Parting
  Gust. Opponent: Serra Angel enchanted with your Pacifism, Hill Giant, and a Soldier token (from
  Raise the Alarm).
- **Do:** Cast it unpromised on the opponent's Serra Angel, then pass to your end step. Separately,
  cast it unpromised on your own Wall of Omens. Cast the second copy promised on Hill Giant.
- **Check:** The Soldier token is never a legal target (nontoken creature). Unpromised: the Angel is
  exiled and Pacifism goes to the graveyard. At the beginning of the next end step, the Angel
  returns under its owner's (the opponent's) control with a +1/+1 counter. It is a new object
  (400.7), unpacified. Wall of Omens returns at the end step and its enters-draw triggers again.
  Promised: the opponent gets a tapped 1/1 Fish, Hill Giant stays in exile for good, and no end-step
  return happens.
- **Known limits:** None documented for this card.

### Starfall Invocation, Coiling Rebirth

*Rules call* — 2cd2d704 (gift)

- **Setup:** 2-player, your main phase. You: 5 Plains + 5 Swamps. Battlefield: Hill Giant, Wall of
  Omens, a Soldier token. Graveyard: Serra Angel already there, and Skithiryx, the Blight Dragon.
  Opponent: Grizzly Bears and Doomed Traveler. Hand: Starfall Invocation and 2 copies of Coiling
  Rebirth.
- **Do:** Cast Starfall Invocation promised. Then cast Coiling Rebirth promised targeting a returned
  creature card (e.g. Hill Giant if you didn't pick it). Then cast Coiling Rebirth promised
  targeting Skithiryx.
- **Check:** Starfall: the opponent draws first, and every creature is destroyed. A graveyard choice
  then offers only Hill Giant and Wall of Omens, the creature cards put into your graveyard this
  way. It doesn't offer the Serra Angel that was already there, the opponent's cards, or the token.
  You must take one (min 1, per the ruling). It returns under your control, and its enters trigger
  (Wall's draw) goes on the stack after the spell finishes. The opponent gets a Doomed Traveler
  Spirit. Coiling Rebirth: the opponent draws, the creature returns, and you get a 1/1 token copy of
  it. Enters triggers from both wait until the spell has resolved (ruling). Targeting legendary
  Skithiryx: it returns but no token is made at all. Unpromised: it only returns the creature.
- **Known limits:** None documented for these cards.

### Scrapshooter

*Rules call* — 2cd2d704 (gift on a permanent)

- **Setup:** 2-player, your main phase. You: 3 Forests (6 for a second cast). Hand: 2 copies of
  Scrapshooter. Opponent: Sol Ring and Rhystic Study, plus Swords to Plowshares with W open. A
  second scenario where the opponent has no artifact or enchantment.
- **Do:** Cast it promised. When it enters, order the triggers and pick a target. On another cast
  promised, have the opponent Swords it with both enters triggers on the stack. Cast it promised
  where the opponent has no artifact or enchantment, and cast it unpromised.
- **Check:** Promised: two enters triggers, the gift (opponent draws a card) and 'destroy target
  artifact or enchantment an opponent controls'. You order them. The target list holds only the
  opponent's artifacts and enchantments. If Scrapshooter is exiled before the gift trigger resolves,
  the opponent still draws (the gift is given as it last existed). It can be cast promised with
  nothing to destroy (ruling): the opponent draws and the destroy trigger simply doesn't happen.
  Unpromised: neither trigger happens.
- **Known limits:** None documented for this card.

### Blighted Agent, Plague Myr, Ichorclaw Myr, Inkmoth Nexus

*Rules call* — 2cd2d704 (infect)

- **Setup:** 2-player, your turn, main 1. You: Blighted Agent, Plague Myr and Ichorclaw Myr, none
  summoning sick. One Inkmoth Nexus controlled since the turn began, a second Inkmoth Nexus played
  this turn, and 3 other lands. Opponent: life 20, poison 0. Their creatures: Wall of Wood (0/3) and
  Hill Giant with one +1/+1 counter (4/4). Ajani, Caller of the Pride on the battlefield.
- **Do:** Activate {1} on both Nexuses. Try to attack with, or tap for mana, the Nexus played this
  turn. Attack: Agent and the older Nexus at the player, Plague Myr at Ajani, Ichorclaw Myr at the
  player. The opponent double-blocks Ichorclaw with Wall of Wood and Hill Giant. Pass into the next
  turn.
- **Check:** The Nexus played this turn and animated can't attack or tap for {C} (ruling). Both
  animated Nexuses are 1/1 flying, infect artifact creature lands with the infect icon. Ichorclaw
  triggers +2/+2 only once despite two blockers (ruling). The player panel shows poison as '☠ n/10'
  and life stays 20. Ajani loses loyalty, not -1/-1 counters (ruling). Damage to the blockers
  becomes -1/-1 counters, not marked damage. Hill Giant's +1/+1 counter and one -1/-1 counter cancel
  out (704.5q). The counters are still there next turn (120.3d).
- **Known limits:** None documented for these cards.

### Phyresis, Tainted Strike, Triumph of the Hordes

*Rules call* — 2cd2d704 (infect granted, noncombat)

- **Setup:** 2-player, your turn. You: Prodigal Pyromancer (not summoning sick) and Grizzly Bears,
  plus Swamps, Forests and Mountains (8+). Basilisk Collar on the battlefield. Hand: Phyresis,
  Tainted Strike, Triumph of the Hordes, Fling. Opponent: 6 poison, Llanowar Elves and Hill Giant.
- **Do:** Cast Phyresis on the Pyromancer and equip the Collar to it. Ping Hill Giant, then the
  opponent. Fling a creature at the opponent. Cast Tainted Strike on the Bears, then Triumph of the
  Hordes, then attack.
- **Check:** The pinged Hill Giant gets one -1/-1 counter and is destroyed by deathtouch even though
  no damage is marked (704.5h). Pinging the opponent gives +1 poison, not life loss, and you gain 1
  life from lifelink (ruling: infect damage is still damage). Fling's damage is normal life loss:
  its source is Fling, which has no infect. Tainted Strike makes the Bears 3/2 with infect. Triumph
  gives +1/+1, trample and infect only to creatures you control as it resolves (611.2c), never the
  opponent's. Combat damage is poison. At 10 poison the opponent loses at the state-based check
  (704.5c), and the game-over reason mentions poison.
- **Known limits:** 704.5h reads 'dealt deathtouch damage this turn', not 'since the last check'
  (BACKLOG). A creature that survived deathtouch while indestructible dies if it loses
  indestructible later that turn.

### Skithiryx, the Blight Dragon

*Rules call* — 2cd2d704 (infect)

- **Setup:** Commander game, 2+ players. Skithiryx is your commander, cast this turn, with 4+ Swamps
  open. Opponent A: 0 poison and 17 combat damage already taken from Skithiryx (or build it up over
  turns). Opponent B: Craw Wurm (6/4).
- **Do:** Activate {B} for haste and attack A. On a later turn, activate {B}{B} to regenerate and
  attack B, letting the Craw Wurm block.
- **Check:** Skithiryx's 4 damage to A is 4 poison with no life change, and it still counts as
  commander damage. A reaches 21 and loses by commander damage (903.10a counts combat damage from
  the commander whatever it does). Against the Craw Wurm, Skithiryx puts 4 -1/-1 counters on it and
  it dies (6/0). Skithiryx takes lethal damage and is regenerated instead: tapped, removed from
  combat, damage removed. Haste lasts until end of turn.
- **Known limits:** None documented for this card.

### Massacre Girl, Known Killer, Necroskitter, Midnight Banshee, Hapatra, Vizier of Poisons

*Rules call* — 2cd2d704 (wither)

- **Setup:** 2-player, your turn. You: Massacre Girl, Known Killer; Necroskitter; Hapatra, Vizier of
  Poisons; Prodigal Pyromancer (not summoning sick); Grizzly Bears. Opponent: life 20, Llanowar
  Elves, Hill Giant (3/3), a Soldier token, Grizzly Bears. Optionally, Midnight Banshee in play for
  your next upkeep.
- **Do:** Ping the opponent's Elves with the Pyromancer. Ping the opponent's face. Attack with your
  Bears into Hill Giant (it blocks). Give the Soldier token a -1/-1 counter (ping it) so it dies.
  Destroy an opponent's creature that has no counters with a spell. Go to your next upkeep with
  Banshee in play.
- **Check:** Elves get a -1/-1 counter (wither via Massacre Girl) and die at 0/0. Then Massacre Girl
  draws a card (toughness < 1 as it last existed), Hapatra makes a deathtouch Snake (you put the
  counters, 120.3d), and Necroskitter asks 'Return that card to the battlefield under your control?'
  On Yes, the Elves come back under your control with no counter. The face ping is ordinary life
  loss (wither only affects creatures). Hill Giant takes 2 counters and survives as 1/1, and your
  Bears dies of marked damage. The Soldier token dying gives you nothing back (a token can't
  return). A counterless creature destroyed gives no draw and no Necroskitter trigger. Banshee's
  upkeep puts -1/-1 on each nonblack creature, yours included, and none on Massacre Girl,
  Necroskitter or Banshee.
- **Known limits:** None documented for these cards.

### Phyrexian Swarmlord, Ichor Rats

*Rules call* — 2cd2d704 (infect)

- **Setup:** (a) 4-player. You control Phyrexian Swarmlord and have 2 poison. Opponents' poison: B
  3, C 2, D 0. Start at the end of the turn before yours. (b) 2-player, your main phase. You and the
  opponent both at 9 poison. You have 3 Swamps and Ichor Rats in hand.
- **Do:** (a) Go into your upkeep, then attack with the new tokens next turn. (b) Cast Ichor Rats.
- **Check:** (a) Swarmlord makes 5 green 1/1 Phyrexian Insect tokens with infect: every opponent's
  poison summed, never yours. They appear as one token stack, each can attack or block on its own,
  and each has the infect icon. (b) Both players reach 10 poison at once and the game is a draw
  (104.4a, the card's ruling). This draw outcome is in the card's comment but not in the commit's
  tests.
- **Known limits:** None documented for these cards.

## Notion Thief, copied abilities, a departed player's permanents (2026-10-03, third round)

### Strionic Resonator

*New decision* — 8cb3444f + b446d1b5 (the ability target's abilityKind: "triggered"; a copied linked trigger stays linked)

- **Setup:** 2 players, your precombat main, 10+ mana of mixed colours. You (A): three untapped
  Strionic Resonators (each taps, so one per activation), Prodigal Sorcerer (not summoning sick) on
  the battlefield. In hand: Elvish Visionary, Banishing Light, History of Benalia. Optional:
  Flameshadow Conjuring on the battlefield and Grizzly Bears in hand. Opponent (B): Grizzly Bears
  and Llanowar Elves on the battlefield, Elvish Visionary in hand, Naturalize with G open.
- **Do:** (1) Activate Prodigal Sorcerer at B. While its ability is on the stack, try to activate a
  Resonator. (2) Cast Elvish Visionary. With its enters trigger on the stack, activate a Resonator
  targeting the trigger. (3) Cast Banishing Light and target B's Grizzly Bears. With the trigger on
  the stack, Resonate it and choose B's Llanowar Elves as the copy's new target. Later, B casts
  Naturalize on Banishing Light. (4) Cast History of Benalia and Resonate its chapter I ability. (5)
  Pass to B's turn. B casts Elvish Visionary: try to Resonate B's trigger. (6) Optional: cast
  Grizzly Bears with Flameshadow out and Resonate Flameshadow's trigger.
- **Check:** (1) The Resonator isn't offered: an activated ability isn't a legal target. (2) The
  stack entry can be picked as the target. No new-targets prompt appears because the trigger has no
  targets, and you draw 2 cards in total. (3) The copy asks for new targets. Both Bears and Elves
  end up exiled, and when Naturalize destroys Banishing Light both return. A copied linked ability
  is linked too (ruling). (4) A chapter ability is a triggered ability (rule 714.2b): two Knight
  tokens. (5) B's trigger isn't offered ('you control'). (6) The copy asks 'Pay {R}…?' again on its
  own. Choices and payments made on resolution are made again for the copy (ruling), and if you pay
  both you get two token Bears.
- **Known limits:** The end-step exile of Flameshadow, Molten Echoes, Kiki-Jiki and similar tokens
  isn't a trigger on the stack, so the Resonator can't copy it (BACKLOG 'End-step token removal
  resolves without the stack'). A modal triggered ability's copy keeps its modes, as the ruling
  says.

### Peter Parker's Camera, Lithoform Engine

*New decision* — 8cb3444f + b446d1b5 (Camera on the copy-ability vocabulary; a copy never offered itself as a new target, rule 115.5)

- **Setup:** 2 players, your precombat main, 10+ mana. You (A): Peter Parker's Camera in hand. On
  the battlefield: Prodigal Sorcerer (not sick) and Lithoform Engine (untapped). In hand: Elvish
  Visionary. Opponent (B): Llanowar Elves.
- **Do:** (1) Cast the Camera. (2) Activate Prodigal Sorcerer targeting B. In response, activate the
  Camera the same turn ({2}, {T}, remove a film counter) targeting the Sorcerer's ability, and
  choose B's Llanowar Elves as the copy's new target. (3) Next turn, cast Elvish Visionary. With its
  trigger on the stack, activate Lithoform Engine's {2} ability targeting the trigger. Then activate
  the Camera targeting Lithoform's ability, and look closely at the new-targets prompt for the
  Camera's copy. (4) Use the Camera's third and last counter on a later turn, then try to activate
  it with 0 film counters.
- **Check:** (1) It enters with 3 film counters, shown on the card. (2) You can tap it the turn it
  arrives (it's not a creature). Paying takes it to 2 counters. Because of the copy, the Elves die,
  and B goes to 19 from the original. (3) The prompt offers the Visionary trigger and Lithoform's
  ability, but never the Camera's copy itself (rule 115.5). Resolved, the copies stack up and you
  draw extra cards. (4) With 0 film counters the Camera isn't offered. A mana ability (tapping a
  land or Elves) is never a target, since it doesn't use the stack.
- **Known limits:** Nothing recorded for the Camera itself. A copy's division of damage can't
  change, only the targets (ruling). The tests don't cover a divided ability, so if you copy one,
  check that its numbers stay.

### Battlemage's Bracers

*New decision* — 8cb3444f + b446d1b5 (activates-ability with a 'may pay {1}' copy)

- **Setup:** 2 players, your precombat main, about 6 untapped mana. You (A): Battlemage's Bracers on
  the battlefield, unattached. Prodigal Sorcerer in hand. Llanowar Elves (not sick) on the
  battlefield. Optional: Walking Ballista with counters. Opponent (B): Llanowar Elves, at 20 life.
- **Do:** (1) Cast Prodigal Sorcerer, then equip the Bracers to it ({2}). (2) Activate the Sorcerer
  at B. When the Bracers trigger resolves, answer 'Pay {1} to copy that ability?' with yes and give
  the copy B's Elves. (3) Untap next turn (or use a second Sorcerer) and decline the payment. (4)
  Tap all your other mana so you can't pay {1}, then activate the Sorcerer again. (5) Move the
  Bracers to your Llanowar Elves (equip) and tap the Elves for mana.
- **Check:** (1) The summoning-sick Sorcerer can use its {T} ability right away, because the Bracers
  give it haste. (2) The prompt reads clearly and {1} is actually spent. The copy asks for new
  targets. B's Elves die and B goes to 19. (3) Declined, nothing is copied and nothing is spent. (4)
  The pay option isn't offered when you can't pay (a 'may' with a cost is offered only when
  payable). (5) The equip activation doesn't trigger the Bracers (it's the Equipment's ability, not
  the creature's). Tapping the Elves for mana doesn't either, since mana abilities don't use the
  stack (rule 605.3b).
- **Known limits:** 'Whenever you activate an ability' (Rings of Brighthearth) isn't built because
  cycling resolves without the stack. That doesn't affect the Bracers. An ability whose cost
  sacrifices the equipped creature isn't copied: once its costs are paid, the Bracers equip nothing
  (same as Illusionist's Bracers, already in manual-checks).

### Increasing Vengeance, Reverberate, Essence Scatter, Frolicking Familiar, Fling

*New decision* — 8cb3444f + b446d1b5 (copy-spell count 1 or 2 by castFrom graveyard; spell-type targets read the face on the stack, rule 715.3b)

- **Setup:** 2 players, your precombat main, 10+ Mountains plus {U}{U}{U}. You (A): in hand
  Lightning Bolt ×2, Increasing Vengeance, Frolicking Familiar, Reverberate, Fling, Grizzly Bears,
  and a second copy of Grizzly Bears on the battlefield. Opponent (B): Grizzly Bears and Llanowar
  Elves on the battlefield, Essence Scatter in hand with {1}{U} open, at 20 life.
- **Do:** (1) Bolt B, then cast Increasing Vengeance from your hand targeting the Bolt, and redirect
  the copy to B's Llanowar Elves. (2) Bolt B again and flash back Increasing Vengeance from the
  graveyard ({3}{R}{R}) on it. Give each copy a different new target (B's Bears, and B). (3) Cast
  Blow Off Steam (Frolicking Familiar's Adventure) at B. B tries Essence Scatter on it. Then copy it
  with Increasing Vengeance or Reverberate. (4) Cast Grizzly Bears so it's on the stack and try to
  target it with Increasing Vengeance. On B's turn, try to target B's Bolt. (5) Flash back
  Increasing Vengeance targeting a Bolt, then Reverberate the Increasing Vengeance. (6) Fling,
  sacrificing your battlefield Grizzly Bears (power 2), at B, then copy it with Increasing Vengeance
  or Reverberate.
- **Check:** (1) Exactly one new-targets prompt. The Elves die and B takes 3. Increasing Vengeance
  goes to the graveyard. (2) Two separate new-targets prompts, one per copy. All three Bolts
  resolve. Increasing Vengeance is exiled (flashback). (3) Essence Scatter isn't allowed, because
  the Adventure on the stack is an instant spell, not a creature spell (rule 715.3b). The copy
  works: B takes 2 in total. (4) Neither the creature spell nor B's spell is a legal target. (5) The
  Reverberate copy of a flashback-cast Increasing Vengeance makes only one copy, because a copy was
  never cast (rulings). (6) Per the Increasing Vengeance ruling (the Fling example), the copy should
  also deal 2: costs paid for the original count for the copy.
- **Known limits:** Step 6 may well fail: report it if the copy deals 0. Nothing in BACKLOG covers
  it, but copySpellFrom/SpellSnapshot in game.ts doesn't carry the spell's lastKnownRefs.sacrificed,
  which is what Fling's 'sacrificed creature's power' reads. Ability copies do carry it
  (copyStackAbility clones it). No test covers copying Fling.

### Ixhel, Scion of Atraxa

*New decision* — 8cb3444f + b446d1b5 (impulse-exile whoseIf with player-counters who: "that-player", face down, spend as any colour)

- **Setup:** 3 players: you (A), B and C, your precombat main. You: Ixhel on the battlefield (not
  sick), and only Plains for mana (6+). Optional: 5 poison counters on yourself. B: 3 poison
  counters, Lightning Bolt on top of their library with a Mountain under it. C: 2 poison counters,
  Grizzly Bears on top of their library. No blockers that can stop a flyer.
- **Do:** (1) Go straight to your end step without attacking. Look at B's exile from all three
  seats. (2) Next turn, cast the exiled Lightning Bolt paying only Plains. Attack C with Ixhel
  (unblocked). Go to your end step with B's Mountain and C's Bears now on top. (3) Kill Ixhel (B or
  C casts removal, or use the builder). Then in later turns try to play the exiled Mountain as your
  land drop, and to cast the exiled Grizzly Bears at instant speed and then in your main phase with
  an empty stack. From B's seat, try to cast B's own exiled card.
- **Check:** (1) The trigger goes on the stack every end step (no intervening 'if'). Only B, with 3
  poison, exiles a card. C (2) and you (however poisoned) exile nothing. Your seat can see the
  Bolt's face in B's exile and is offered it, while B's and C's seats see only a face-down card back
  (rule 406.3). (2) The Bolt can be paid with white mana (rule 609.4b). Ixhel's combat damage gives
  C 2 poison (toxic 2, now 4) as well as 2 life lost. At the end step B and C exile at once, as one
  exile. (3) After Ixhel has left you can still look at and play the cards (ruling). The Mountain
  uses your land drop, and the Bears follow normal timing (sorcery speed only, ruling). B can never
  cast their own exiled card.
- **Known limits:** Nothing recorded for Ixhel. The any-colour spending applies only to casting
  those cards, not to other costs.

### Notion Thief

*Rules call* — 8cb3444f + b446d1b5 (Notion Thief made exact: exceptFirstInDrawStep, redirects handed on each once)

- **Setup:** 2 players. You (A): Notion Thief on the battlefield, plus a second Notion Thief in your
  library or hand for part (c). Opponent (B): Howling Mine (untapped) and Phyrexian Arena on the
  battlefield; in hand Faithless Looting with a red source open, and Divination with {2}{U} open.
  Know both libraries' top cards. Start at the end of your turn so B's turn comes next. Optional:
  Wheel of Fortune in B's hand with {2}{R}. For part (d), a 3-player game where B and C each control
  a Notion Thief.
- **Do:** (a) Pass to B's turn and watch B's upkeep, then B's draw step. (b) In B's main phase B
  casts Faithless Looting. (c) Give B a Notion Thief of their own (one each, a duel) and have B cast
  Divination, then repeat with you controlling two Thieves against B's one. (d) Optional: B casts
  Wheel of Fortune with only your Thief out. (e) On your own turn, draw normally.
- **Check:** (a) Upkeep: Phyrexian Arena's draw goes to you (it isn't in B's draw step) and B still
  loses 1. Draw step: B keeps the turn-based draw (the first card they draw in their draw step is
  spared), and Howling Mine's extra card for B goes to you. (b) You draw 2 and B still has to
  discard 2. Only the draw is replaced (ruling 2018-03-16). (c) One Thief each: B draws both cards.
  Each Thief applies to a draw once, so the draw goes B to A and back to B ('it really will be that
  player who draws', ruling). The log should show two redirects per card. With your two Thieves
  against B's one, it goes B to A, back to B, then to A again: you draw both, with three redirects
  per card. (d) B discards their hand and draws nothing. All 7 of B's cards go to you, on top of
  your own 7. (e) Your own Thief never touches your draws, and Howling Mine gives you your extra
  card normally.
- **Known limits:** With Thieves controlled by two different opponents (3+ players), the drawing
  player should choose which one applies first (ruling). The engine takes the opponent first in turn
  order after the drawer and doesn't ask (BACKLOG; AUTHORING §15). With Laboratory Maniac and an
  opponent's Thief, the win is applied first and no replacement order is offered (§15). The older
  docs/manual-checks.md entry (Laboratory Maniac … Notion Thief) still lists 'redirects every
  opponent draw' as a known limit. That's out of date now that this pass fixed it.

### Molten Echoes, Flameshadow Conjuring

*Rules call* — 8cb3444f + b446d1b5 (create-token-copy with gained haste, exileAtEndStep)

- **Setup:** 2 players, your precombat main, plenty of mana including several red. You (A):
  Flameshadow Conjuring on the battlefield. In hand: Molten Echoes, Elvish Visionary, Llanowar
  Elves, Grizzly Bears, Briarpack Alpha (flash). Opponent (B): anything.
- **Do:** (1) Cast Molten Echoes and choose Elf at the creature-type prompt. (2) Cast Elvish
  Visionary. Both enchantments trigger, so order them, and pay {R} for Flameshadow's. (3) Cast
  Grizzly Bears, then tap out and cast Llanowar Elves with no red left. (4) Attack with the tokens,
  then go to your end step. (5) On B's turn, in B's end step, flash in Briarpack Alpha and pay {R}
  for Flameshadow's copy. Then let turns pass to your own end step.
- **Check:** (1) The prompt offers real creature types only (ruling). (2) You get two hasty token
  Visionaries, each drawing a card from its own enters trigger. The token entering doesn't trigger
  either enchantment (nontoken only). (3) A non-Elf triggers only Flameshadow. With no red available
  Flameshadow offers no payment, and Molten Echoes still copies the Elf. (4) The tokens can attack
  this turn (haste). At the start of your end step every such token is exiled. (5) A token made
  during an end step survives that end step and is exiled at the next one, which is your turn's
  (Flameshadow ruling), whoever controls it then. The real creatures stay.
- **Known limits:** The exile happens silently as the end step begins. It isn't a delayed trigger on
  the stack, so it can't be responded to, countered (Sublime Epiphany) or copied (Strionic
  Resonator) (BACKLOG and AUTHORING §15 'End-step token removal doesn't use the stack'). Don't
  report the missing stack entry. A token copy is never asked an 'as this enters' choice (§15).

### Boseiju, Who Endures, (a player who has left the game)

*Rules call* — 2ccf8c61 (nothing a departed player leaves behind can be targeted, rule 800.4a)

- **Setup:** 3 players (A, B, C), A's precombat main. A: Boseiju, Who Endures and Lightning Bolt ×2
  in hand, with Forest ×2 and Mountain ×2 untapped. Optional: Scavenging Ooze (not sick) with {G}
  spare. B: Tarnished Citadel and a creature. C: at 3 life, with Tarnished Citadel, Grizzly Bears,
  and a card in their graveyard. Optional: C controls B's creature via Mind Control.
- **Do:** (1) Start activating Boseiju's channel from your hand to see C's Citadel offered, then
  cancel. (2) Activate the channel targeting C's Tarnished Citadel. With it on the stack, Bolt C to
  0. (3) After C is out, activate the channel again and try every target. Also try to Bolt C's
  Grizzly Bears and to point Scavenging Ooze at a card in C's graveyard. Optional: target the
  creature C was controlling with Mind Control.
- **Check:** (1) C's land is a legal target while C is in. (2) The Bolt resolves and C loses at
  once. The channel then doesn't resolve, because its only target is gone with C (rules 800.4a,
  608.2b). Nobody is asked to search, and the game doesn't freeze waiting on C. (3) Only B's Citadel
  is offered. None of C's permanents, graveyard cards or other objects show up as targets, though
  they stay visible on C's side. B's creature that C had stolen is back under B's control (C's
  control effect ended, 800.4a) and is targetable normally.
- **Known limits:** By design, a departed player's objects stay where they are, visible but out of
  the game. That is not a bug. Not built yet (BACKLOG 'The rest of leaving the game'): a decision
  the departed player would have made isn't handed to another player (800.4g–h), and a permanent
  whose control effect ends with its default controller gone isn't exiled (800.4c).

## The Tarkir precons, first half: costs, cycling, graveyard statics, edicts (2026-10-03, third round)

### Dismantling Wave, Windgrace's Judgment, Afterlife from the Loam, The Balrog of Moria (dies trigger)

*New decision* — f6771193 (targets bound to a seat), reviewed in 44dbcd86

- **Setup:** A 4-player game. Turn order: you, B (next), C, D. Your precombat main phase, with
  plenty of untapped W, B and G mana (8+ of each). Your battlefield: Sol Ring, The Balrog of Moria.
  B's battlefield: Sol Ring, Mind Stone, Grizzly Bears. C's battlefield: Ghostly Prison, an Island,
  Serra Angel. D's battlefield: Craw Wurm, and no artifacts or enchantments. Graveyards: yours has
  Grizzly Bears plus 4 or more other cards to delve. B's has Craw Wurm and Serra Angel. C's has
  Giant Spider. D's is empty. Your hand: Dismantling Wave, Windgrace's Judgment, Afterlife from the
  Loam, and some removal for your own Balrog (any destroy spell).
- **Do:** 1) Cast Dismantling Wave. Work through each target slot, try to pick two of B's artifacts,
  and skip D's slot. 2) Cast Windgrace's Judgment, aiming at B's Grizzly Bears and C's Ghostly
  Prison or Serra Angel, and try to pick C's Island. 3) Cast Afterlife from the Loam (delve some
  cards). Pick your Grizzly Bears, B's Craw Wurm and C's Giant Spider, and try to take both of B's
  cards. 4) Destroy your own Balrog. Say yes to 'Exile The Balrog of Moria?' and pick one creature
  for each opponent. Repeat with a second Balrog and say no. 5) Optional: have B concede, then cast
  another seat-bound spell.
- **Check:** Each slot is tied to one opponent by seat, and its prompt reads 'choose artifact or
  enchantment the next opponent controls', then '...the opponent 2 seats on controls', then '...the
  opponent 3 seats on controls'. A slot offers only that player's legal permanents: B's slot offers
  Sol Ring and Mind Stone only, C's offers Ghostly Prison only, and D's has nothing, so you must be
  able to skip it without the cast getting stuck. Two picks from one player are refused. Every
  chosen target is destroyed at the same time, and your own Sol Ring survives. Windgrace's Judgment
  never offers lands. Afterlife from the Loam has four slots (your graveyard, then each opponent's
  in seat order), offers only creature cards, and puts the chosen cards onto the battlefield
  together under your control, each showing the Zombie type next to its others. For the Balrog: on
  yes it goes from your graveyard to exile, then a reflexive 'when you do' trigger asks for one
  creature per opponent (rule 603.12) and exiles them together. On no it stays in the graveyard and
  nothing is exiled. Once B has left, the other players keep their seat numbers: C is still 'the
  opponent 2 seats on' and B's slot has nothing to offer.
- **Known limits:** Prompts name a slot by seat ('the next opponent', 'the opponent 2 seats on'),
  not by the player's name. That's the engine's wording, but report it if it's hard to tell who is
  meant. A game seats at most four, so three opponent slots is the maximum. Grasp of Fate (same
  target shape) is deliberately not authored: see BACKLOG.

### Fractured Sanity, Decree of Pain, Agonasaur Rex, Titanoth Rex, Vizier of Tumbling Sands, Magmakin Artillerist, The Balrog of Moria (cycling), Dismantling Wave (cycling)

*New decision* — f6771193 (cycling on the stack), fixed in 44dbcd86 (split second)

- **Setup:** 2-player game (3-player also works for the each-opponent mills). Your precombat main
  phase with lots of untapped mana of every colour. Your battlefield: Magmakin Artillerist, Grizzly
  Bears, a tapped Island. Your hand: Fractured Sanity, Decree of Pain, Agonasaur Rex, Titanoth Rex,
  Vizier of Tumbling Sands, a second Magmakin Artillerist, The Balrog of Moria, Migratory Route
  (basic landcycling), Think Twice. Opponent's battlefield: Serra Angel, Grand Abolisher. Opponent's
  hand: Angel's Grace and Krosan Grip, with mana for them. The opponent's library has 20+ cards.
- **Do:** 1) Cycle Fractured Sanity with the Cycle button. Pass priority one step at a time. 2)
  Cycle Magmakin Artillerist from hand while the other one is on the battlefield. 3) Cycle Agonasaur
  Rex and target Grizzly Bears, then cycle another copy (or redo) and skip the target. 4) Cycle
  Titanoth Rex. 5) Cycle Vizier of Tumbling Sands and target the tapped Island. 6) Cycle Decree of
  Pain. 7) Cycle Migratory Route, then cast Think Twice in response. 8) Have the opponent cast
  Krosan Grip (or Angel's Grace), and look for a Cycle button while it's on the stack. 9) Pass to
  the opponent's turn (Grand Abolisher's controller) and try cycling a creature card there. 10)
  Cycle The Balrog of Moria.
- **Check:** The card goes to the graveyard and the cost is paid as soon as you cycle. The stack
  shows a cycling ability sourced from that card, with its 'when you cycle this card' trigger above
  it (rule 702.29c). The trigger resolves first: for Fractured Sanity the opponent mills 4 and only
  then do you draw. Two Magmakins deal 2 damage in total (the cycled card's own 1, plus 1 for the
  discard from the one on the battlefield), both before the draw (Magmakin's ruling). Agonasaur
  Rex's target prompt (creature or Vehicle) can be skipped: with a target it gets two +1/+1
  counters, trample and indestructible. Titanoth Rex puts a trample counter on a creature you
  control, chosen automatically if you control only one. Vizier's cycle trigger can untap any
  permanent, but its tap ability can't target Vizier itself. Cycled Decree of Pain gives every
  creature -2/-2 until end of turn. The landcycling search waits on the stack: Think Twice resolves
  first, then the search prompt appears. Under split second (rule 702.61a) no Cycle button is shown
  and a cycle attempt is refused, and it comes back once that spell resolves. Under Grand Abolisher
  you can still cycle on its controller's turn (its ruling: a card in hand isn't a permanent).
  Cycling the Balrog makes two Treasures. Cycling Dismantling Wave ({6}{W}{W}) destroys every
  artifact and enchantment, yours too, before the draw.
- **Known limits:** 'Whenever you activate an ability' (Rings of Brighthearth) doesn't see cycling
  yet, but no such card is in the pool (BACKLOG).

### Command Beacon, Hellkite Courser

*New decision* — 7f0bc8b0 (the command zone), with tests added in 04066f66

- **Setup:** 2-player Commander game. Your commander is in the command zone and hasn't been cast yet
  (commander tax 0). If the builder allows partners, put a second commander there to test choosing.
  Your battlefield: Command Beacon (untapped) and enough lands to cast Hellkite Courser ({4}{R}{R})
  plus your commander. Your hand: Hellkite Courser and some removal. Opponent's commander is in
  their own command zone. Your precombat main phase.
- **Do:** 1) Cast Hellkite Courser. When its ETB asks, choose your commander, and on a replay
  decline instead. 2) Attack with the commander this turn. 3) Let the turn reach the end step. 4)
  Replay: after the commander is on the battlefield, kill it before the end step (or blink it if you
  have a flicker effect). 5) On a later turn with the commander back in the command zone, activate
  Command Beacon ({T}, sacrifice it) and choose the commander. Cast it from your hand, then later
  cast it from the command zone again. 6) Activate a second Beacon while your commander is not in
  the command zone.
- **Check:** Courser's prompt lists only commanders you own that are in the command zone (never the
  opponent's) and can be declined. The chosen commander enters with haste and can attack straight
  away. The commander tax doesn't go up, since it was put onto the battlefield, not cast (ruling).
  At the beginning of the end step a delayed trigger puts it back in the command zone with no
  'command zone instead?' prompt. If the commander died first, the usual rule 903.9b prompt appears
  when it dies, and the end-step trigger does nothing. If it was blinked, it is a new object (rule
  400.7): it stays on the battlefield and has lost the haste. If Courser itself dies, the return
  still happens. Command Beacon puts the commander into your hand (with two commanders it asks you
  to choose one, per the ruling). Cast from hand, it costs only its mana cost with no tax, and
  casting it that way adds no tax for the next command-zone cast (ruling). With no commander in the
  command zone, the Beacon is still sacrificed and nothing else happens.
- **Known limits:** Ask about this rather than reporting it as a bug: the popup title comes from the
  generic zone-choice wording ('Choose a card to put onto the battlefield') and doesn't mention the
  command zone or that the choice is optional.

### Will of the Abzan, Priest of Forgotten Gods, Crackling Doom, Soul Shatter, Will of the Mardu

*New decision* — 7f0bc8b0 (per-player edicts, greatest among its controller's), fixed in 04066f66 (one simultaneous edict); Will of the Mardu from 20b3fdad

- **Setup:** 4-player Commander game. Turn order: you, B, C, D. Your battlefield: your commander
  (any creature), Priest of Forgotten Gods (not summoning sick) and two spare creatures, lots of
  R/W/B mana. Your graveyard: Serra Angel. B's battlefield: Craw Wurm (6/4) and Grizzly Bears. C's
  battlefield: two Craw Wurms (a tie for greatest power). D's battlefield: Serra Angel, and a
  planeswalker with mana value 3 (e.g. Ajani, Caller of the Pride) next to a Grizzly Bears. Your
  hand: Will of the Abzan, Crackling Doom, Soul Shatter, Will of the Mardu. Everyone at 20 life.
- **Do:** 1) Cast Will of the Abzan choosing BOTH modes (allowed because you control a commander).
  Target C and B but not D (picking C first), and target your Serra Angel. Each opponent then picks
  what to sacrifice. 2) Try targeting the same opponent twice. 3) Without your commander on the
  battlefield (or with an opponent's commander you've stolen), check how many modes you may choose.
  4) Activate Priest: sacrifice two other creatures, target B and D (and on a replay, no players).
  5) Cast Crackling Doom. 6) Cast Soul Shatter. 7) Cast Will of the Mardu with both modes: Warriors
  for target player B, damage to a creature.
- **Check:** Will of the Abzan: a second slot can't be the opponent already chosen. The sacrifice
  prompts go in turn order (B first, then C), whatever order you targeted them in. Each player is
  offered only their own greatest-power creature: B gets only Craw Wurm, while C chooses between the
  two tied Wurms. B's Wurm is still on the battlefield while C chooses, and both leave together (one
  edict, rule 101.4). Then B and C lose 3 each, D is untouched, and Serra Angel returns under your
  control. 'Choose both' depends only on controlling some commander, anyone's, checked when you
  choose modes (ruling). Priest: the two sacrifices are chosen as part of the cost. Each targeted
  player loses 2, then they choose and sacrifice together. You add {B}{B} and draw even with zero
  targets (ruling). Crackling Doom: 2 damage to each opponent, and each sacrifices their
  greatest-power creature, choosing among ties; your own creatures are safe. Soul Shatter: D must
  sacrifice the planeswalker (mana value 3), not the Bears (mana value 2). Will of the Mardu:
  Warriors equal to the creatures B controls, then damage equal to the creatures you control,
  counting the new Warriors (both modes resolve in printed order).
- **Known limits:** 'Any number of target opponents' is three optional slots, enough for any table
  of four or fewer.

### Temple of the Dragon Queen

*New decision* — 0790d746 (a reveal land spared by either way in)

- **Setup:** 2-player game, your precombat main phase with no land played. Case A: your hand has
  Temple of the Dragon Queen and Shivan Dragon, and you control no Dragon. Case B: hand has the
  Temple only, and you control a Dragon (e.g. Shivan Dragon on the battlefield). Case C: hand has
  the Temple and Shivan Dragon, no Dragon on the battlefield, and you decline to reveal.
- **Do:** Play the Temple in each case. Answer the colour prompt (pick blue, say), then the reveal
  prompt if it appears. Tap the Temple for mana afterwards.
- **Check:** The colour is asked first and offers exactly the five colours, not creature types, even
  though it uses the creature-type decision internally. Then 'you may reveal a Dragon card' offers
  only the Dragon cards in your hand (never a card that just has 'Dragon' in its name, like the
  Temple itself, per the ruling) plus a decline option. Both questions come before the land moves
  (rule 614.12). Case A (revealed): enters untapped, the revealed card is shown to the opponent and
  in the log. Case B (no reveal, but you control a Dragon): untapped. Case C (Dragon held back, none
  on the battlefield): tapped. Tapping it adds one mana of the chosen colour.

### Quirion Ranger, Mina and Denn, Wildborn, Multani, Yavimaya's Avatar

*New decision* — 1b77c914 (bounce costs)

- **Setup:** 2-player game, your precombat main phase. Your battlefield: Quirion Ranger, Mina and
  Denn, Wildborn, a tapped Grizzly Bears, one untapped Forest, one untapped Mountain. Your
  graveyard: Multani, Yavimaya's Avatar and one land card (e.g. a Mountain). The opponent has a land
  card in their graveyard. For the second Quirion check, give the opponent a Quirion Ranger, two
  Forests and a tapped creature of their own.
- **Do:** 1) Activate Quirion Ranger targeting the Bears. 2) Try to activate it again the same turn
  after replaying the Forest. 3) Activate Mina and Denn: pay {R}{G} by tapping both lands, target
  the Bears, then return the Mountain you just tapped. Replay a returned land (Mina and Denn gives
  an extra land drop). 4) With exactly 2 lands, then with 3, look at whether Multani's graveyard
  ability is offered; activate it with 3 lands. 5) Before step 4, check Multani's P/T while it's on
  the battlefield (put it there or note it). 6) On your turn, pass priority and have the opponent
  activate their Ranger with two Forests.
- **Check:** With one Forest, Quirion returns it immediately without asking. The Mountain is never
  offered, since it isn't a Forest. The target untaps, and a second activation that turn is refused
  ('Activate only once each turn'). With two or more choices, the ability appears on the stack and a
  'Choose one to return to its owner's hand' prompt lists only qualifying lands you control. After
  choosing, priority goes back to whoever activated it, even on another player's turn (rule 117.3c).
  Mina and Denn may return the land tapped to pay for it, and the target gains trample until end of
  turn. You can play two lands this turn. Multani on the battlefield is +1/+1 for each land you
  control and each land card in YOUR graveyard (not the opponent's). In the graveyard its ability
  isn't offered with fewer than two lands, and with two lands both may be tapped for {1}{G} and then
  returned. Activating it returns the two lands you chose and puts Multani into your hand.
- **Known limits:** The lands to return are chosen after the ability is already on the stack (the
  engine pays this cost then). Nobody gets priority in between, so this is the intended rendering of
  rule 602.2b, not a bug.

### Myr Battlesphere

*New decision* — 1b77c914 ('tapped' this-way kind)

- **Setup:** 2-player game. Your hand: Myr Battlesphere, with 7 mana. Or start it on the
  battlefield, not summoning sick, with four Myr tokens. The opponent controls a planeswalker. Your
  precombat main phase.
- **Do:** 1) Cast Battlesphere and watch the ETB. 2) Next turn, or right away if set up not
  summoning sick, attack the opponent with Battlesphere alone. When asked to 'Tap any number of
  untapped Myr you control', tap 3. 3) Replay attacking the planeswalker. 4) Replay tapping none.
- **Check:** The ETB makes four 1/1 colourless Myr artifact creature tokens. The attack prompt
  offers only untapped Myr you control, including tokens that are still summoning sick (tapping for
  an effect isn't a {T} cost, per the ruling), and allows choosing zero. Tapping 3 taps exactly
  those three, makes Battlesphere 7/7 until end of turn, and deals 3 damage right away to the player
  (or the planeswalker, which loses 3 loyalty) it's attacking, before combat damage. Tapping none
  gives no bonus and no damage.

### Lord of the Forsaken, Welcome the Dead, Teval's Judgment, Essence Anchor, Gravecrawler

*New decision* — a6258cda (spend-only-from-graveyard mana, graveyard turn stats), 20b3fdad (Teval's Judgment, Gravecrawler)

- **Setup:** 2-player game, your precombat main phase, you at 20 life. Your battlefield: Lord of the
  Forsaken, Teval's Judgment, Essence Anchor (untapped), 3 untapped Swamps. Your graveyard: Welcome
  the Dead, Gravecrawler. Your hand: Fractured Sanity, a cheap spell (e.g. Sol Ring), a few other
  cards. Library: 10+ cards. You control no Zombie.
- **Do:** 1) Check whether Gravecrawler can be cast from your graveyard and whether Essence Anchor's
  ability is offered. 2) Cycle Fractured Sanity ({1}{U}; add an Island) so a card goes from hand to
  graveyard this turn. 3) Activate Lord's 'Pay 1 life: Add {C}' by hand five times, and try to spend
  that {C} on Sol Ring from hand. 4) Flash back Welcome the Dead ({5}{B}) using the five {C} and a
  Swamp. Answer Teval's Judgment's mode prompt (choose the Zombie). Resolve Welcome the Dead: draw
  2, discard 1. 5) Cast Gravecrawler from the graveyard with a Swamp and answer Teval's again. 6)
  Activate Essence Anchor. 7) Make a card leave your graveyard a fourth time this turn. 8) At your
  next upkeep, answer Anchor's surveil.
- **Check:** Before anything leaves your graveyard, Gravecrawler isn't castable from there (no
  Zombie you control; an opponent's Zombie wouldn't count either), and Anchor isn't offered. Lord's
  mana must be activated by hand. Each activation costs 1 life, and the {C} it floats can't pay for
  a spell from your hand but does pay flashback's generic cost. Casting Welcome the Dead triggers
  Teval's Judgment, offering all three modes, and it resolves above the spell. Welcome the Dead: you
  lose 2 life and make X tapped 2/2 Zombie Druids, where X counts every card put into your graveyard
  from hand or library this turn: the cycled Fractured Sanity plus the discard, so 2 here. It
  doesn't count itself going from stack to graveyard. Then Welcome the Dead is exiled. Gravecrawler
  is now castable from the graveyard, at sorcery speed, and Teval's offers only the two unchosen
  modes. After a card has left your graveyard this turn, Anchor makes a 2/2 Zombie Druid, but only
  during your turn. The fourth leave in a turn gives no prompt at all: every mode has been used, so
  the trigger is removed.
- **Known limits:** The auto-payer never uses Lord's unlimited mana ability, so you activate it by
  hand. A known BACKLOG gap: the engine doesn't check state-based actions after a mana ability you
  activate by hand, so if you pay your life to 0 with Lord you won't lose until the next spell or
  ability is cast or resolves.

### Wonder, Anger, Brawn, Filth

*Rules call* — 7f0bc8b0 (statics that work from the graveyard), fixed in 04066f66 (graveyard timestamps that stick)

- **Setup:** 2-player game, your precombat main phase. Your battlefield: Grizzly Bears (just put
  there, summoning sick), a second Grizzly Bears, a Mountain, a Forest, a Swamp, but no Island yet.
  Your graveyard: Anger, Brawn, Filth. Island and Wonder in hand (or Wonder on the battlefield). The
  opponent controls a Swamp and Grizzly Bears. You have Turn to Frog plus blue mana, and a removal
  spell that can kill your own Wonder.
- **Do:** 1) Look at your creatures' keywords. 2) Play the Island, with Wonder still not in the
  graveyard. 3) Put Wonder on the battlefield and look at the Bears. 4) Attack with the
  summoning-sick Bears. 5) Timestamp check A: with Wonder on the battlefield, cast Turn to Frog on a
  Bears, THEN kill Wonder. 6) Timestamp check B (replay): kill Wonder first, THEN cast Turn to Frog
  on a Bears.
- **Check:** From your graveyard: Anger gives your creatures haste (you control a Mountain), so the
  just-arrived Bears can attack. Brawn gives trample (Forest). Filth gives swampwalk (Swamp), so
  your attackers can't be blocked by an opponent who controls a Swamp. The opponent's creatures get
  none of these. Wonder on the battlefield has flying itself but grants nothing. Its graveyard
  static needs it in your graveyard and an Island under your control. A: the Frog'd Bears HAS
  flying, because Wonder's timestamp is the moment it reached the graveyard (rule 613.7d, Anger's
  ruling), which is later than Turn to Frog's. B: the Frog'd Bears has NO flying, because Turn to
  Frog is newer. Granted keywords should show on the creature cards in the client.

### Legion Warboss, Ainok Strike Leader, Within Range

*Rules call* — 1b77c914 (tokens that attack this combat, this and/or your commander); Within Range from 20b3fdad

- **Setup:** 3- or 4-player Commander game (you, B, C, and optionally D). Your battlefield, none
  summoning sick: Legion Warboss, Ainok Strike Leader, your commander (a creature), Within Range
  (already on the battlefield, or cast it in main phase 1 to see its two 1/1 red Warriors).
  Opponents have no flying blockers to worry about. All at 20 life. Your precombat main phase.
  Optional variant: give B, and later both B and C, a Ghostly Prison.
- **Do:** 1) Go to combat and watch the beginning-of-combat trigger. 2) At declare attackers, try
  leaving the Goblin token home. 3) Attack B with Warboss, the Goblin and Ainok. Point mentor at the
  Goblin. When the triggers are put on the stack, order them so Ainok's resolves before Within
  Range's. 4) Replay with Within Range resolving first. 5) Next turn, attack with only your
  commander, then (replay) with only some other creature. 6) Ghostly Prison variant: under B only,
  then under B and C.
- **Check:** At the beginning of combat on your turn only, Warboss makes a 1/1 red Goblin with haste
  that must attack this combat. Declaring without it is refused. Mentor can target only an attacking
  creature with power less than 2, so the Goblin is legal and Ainok (power 2) isn't. Ainok makes one
  tapped Goblin per opponent, each attacking that opponent, even opponents you didn't attack. Never
  declared, they trigger nothing. Within Range counts the creatures attacking each opponent when it
  resolves (not their planeswalkers). With Ainok first, B loses 4 and C (and D) lose 1 each. With
  Within Range first, B loses 3 and the others 0. Ainok triggers when your commander attacks alone,
  but not for some other creature or for an opponent's commander you control. After combat the
  Goblin's must-attack is gone, but its haste lasts the turn. Ghostly Prison: Warboss's ruling says
  it never has to pay an attack cost, so with Prison under B only the Goblin must still attack C
  (the untaxed option, rule 508.1d), and with Prison under both it may stay home.

### Divine Visitation, Redoubled Stormsinger, Legion Warboss, Ainok Strike Leader, The Balrog of Moria (cycling, for Treasures)

*Rules call* — 1b77c914 (Angels instead, copies of each token entered this turn, token stacks keyed by entry turn)

- **Setup:** 3-player game (you, B, C). Your battlefield, none summoning sick: Divine Visitation,
  Legion Warboss, Ainok Strike Leader, Redoubled Stormsinger. One older Goblin token made on an
  earlier turn. Hand: The Balrog of Moria plus {3}{R}. B controls a Legion Warboss of their own.
  Your precombat main phase.
- **Do:** 1) Cycle the Balrog. 2) Go to combat. 3) Attack B with the Warboss's token, Ainok and
  Stormsinger. Order the triggers so Ainok's resolves before Stormsinger's. Answer the prompt asking
  what each copy attacks, sending some at C. 4) Replay with Stormsinger's trigger resolving first.
  5) Go to the end step. 6) On B's turn, watch B's Warboss.
- **Check:** The Balrog's Treasures stay Treasures: only creature tokens are replaced. Warboss's
  token comes out as a 4/4 white flying, vigilant Angel that still has haste and still must attack
  this combat ('anything else specified still applies', Divine Visitation's ruling). Ainok's tokens
  are Angels too, each tapped and attacking its own opponent. Stormsinger copies each creature token
  you control that entered this turn, once per token even inside a stack. With Ainok first that's 3
  copies, with Stormsinger first only 1, and never the older Goblin from an earlier turn. Under
  Divine Visitation each copy is also an Angel. Each copy enters tapped and attacking whichever
  player or planeswalker you pick for it (enter-attacking prompt). They were never declared, so no
  'whenever attacks' trigger fires for them. At the beginning of the next end step the copies are
  sacrificed and the originals stay. Tokens from different turns show as separate stacks. B's
  Warboss makes a normal Goblin, since Divine Visitation affects only your tokens.
- **Known limits:** Token copies made as Angels lose all their copy exceptions (e.g. a copy's 'gains
  haste' exception). That's intended, per Divine Visitation's ruling.

### Sarkhan, Soul Aflame

*Rules call* — 1b77c914 (becoming a copy until end of turn)

- **Setup:** 2-player game, your precombat main phase. Your battlefield: Sarkhan, Soul Aflame with
  one +1/+1 counter (3/5), exactly 5 untapped Mountains (+1 more for a later Dragon). Hand: Shivan
  Dragon, Lathliss, Dragon Queen, another Dragon. The opponent has a Dragon to put onto the
  battlefield on their turn (or flash one in).
- **Do:** 1) Cast Shivan Dragon with only 5 lands. 2) Say yes to 'Have Sarkhan become a copy of that
  Dragon until end of turn?'. 3) Use the copy's firebreathing ({R}: +1/+0). Try casting another
  Dragon and see what it costs. 4) Pass to the cleanup step. 5) Replays: copy Lathliss (legendary);
  decline the prompt; kill the Dragon in response to the trigger and then say yes; have the
  opponent's Dragon enter.
- **Check:** Shivan Dragon ({4}{R}{R}) costs {3}{R}{R}: the reduction is generic only. As a copy,
  Sarkhan is a 6/6 flying Dragon (Shivan's 5/5 plus his own counter) with firebreathing. He is still
  named Sarkhan, Soul Aflame and is legendary, and he stays tapped or untapped as he was. He has
  only Shivan's abilities, so while he's a copy, Dragon spells cost their full price and another
  Dragon entering gives no copy trigger (rule 707.2). The board and card display should show the
  copy clearly. In the cleanup step he's a 3/5 Human Shaman again (rule 514.2). Copying Lathliss:
  both stay, with no legend rule, because their names differ (ruling). Killed in response: he copies
  the Dragon as it last existed. The opponent's Dragon doesn't trigger him.

### Colfenor's Urn, Decree of Pain

*Rules call* — a6258cda (exiled with a source), fixed in 44dbcd86 (an Urn taken isn't sacrificed)

- **Setup:** 2-player game, your precombat main phase, 8+ mana including {B}{B} (plus {G} for Giant
  Growth). Your battlefield: Colfenor's Urn, Serra Angel (4/4), Craw Wurm (6/4), Giant Spider (2/4),
  Grizzly Bears. Opponent's battlefield: Serra Angel, Darksteel Myr. Your hand: Giant Growth, Decree
  of Pain. A 4/4 creature token too if available (e.g. one made earlier).
- **Do:** 1) Giant Growth the Bears (now 5/5). 2) Cast Decree of Pain. Answer each 'Exile it with
  Colfenor's Urn?' prompt: yes for the Angel, Wurm and Spider, and try declining one on a replay. 3)
  Go to your end step. 4) Replay with only two exiled, then let a third be exiled on the opponent's
  turn and watch their end step.
- **Check:** Decree destroys every creature except the indestructible Darksteel Myr, can't be
  regenerated, and draws a card for each creature destroyed (not the Myr). The Urn asks about each
  creature of yours with toughness 4 or more as it last existed, including the Giant-Growthed Bears.
  It doesn't ask about the opponent's Serra Angel (not your graveyard). A token can trigger it, but
  it has ceased to exist, so it exiles nothing (ruling). Declining leaves the card in the graveyard.
  With three exiled, at the beginning of the end step (any player's end step) the Urn is sacrificed
  and all three return to the battlefield under their owner's control as new, summoning-sick
  creatures. With only two, nothing happens until a third arrives, and then it happens at the next
  end step, even on the opponent's turn. It counts every card ever exiled with it, but returns only
  those still in exile.
- **Known limits:** The case where another player takes control of the Urn in response to its
  end-step trigger (it isn't sacrificed and nothing returns, per its ruling, rule 701.21a) is
  covered by automated tests. It needs an instant-speed artifact steal to try by hand.

### Wall of Roots, Devoted Druid, Tree of Redemption, Tree of Perdition

*Rules call* — a6258cda (a counter as a cost, exchanging a life total with toughness)

- **Setup:** 2-player game, your precombat main phase. Your battlefield: Wall of Roots (may be
  tapped or summoning sick), Devoted Druid (not sick), Tree of Redemption with two +1/+1 counters
  (2/15, not sick), Tree of Perdition (not sick), one untapped Forest. Your life: 7. Opponent's
  life: 31. Hand: Grizzly Bears, Llanowar Elves. Separate replay: the opponent controls The Lord of
  Pain (your life can't go up).
- **Do:** 1) Activate Wall of Roots by hand, then try again. 2) Cast Grizzly Bears with only the
  Forest plus the Wall available. Replay with two Forests. 3) On the opponent's upkeep, when you get
  priority, activate the Wall again. 4) Devoted Druid: tap for {G}, untap it with a -1/-1 counter,
  and repeat until the counter would make its toughness 0. 5) Activate Tree of Redemption. 6)
  Activate Tree of Perdition targeting the opponent. 7) Lord of Pain replay: Tree of Redemption at 5
  life, then at 30 life.
- **Check:** Wall: adds {G} and gets a -0/-1 counter (0/4), works while tapped or summoning sick,
  and only once each turn, but again on the next player's turn (0/3). The auto-payer uses it only
  when the lands can't pay. Druid: the untap goes on the stack. The second counter makes it -2/0, so
  it dies before the untap resolves (ruling). Tree of Redemption: you go to 15 life, its former
  toughness counting the counters, and it becomes 2/9: toughness set to 7, with the counters applied
  on top (Lunarch Mantle ruling, rule 701.12g). The change is permanent, not until end of turn. Tree
  of Perdition: the opponent goes to 13 and the Tree becomes 0/31. Opponent-only target. Under The
  Lord of Pain at 5 life nothing happens at all, neither half (rule 701.12a). At 30 life the
  exchange works: you lose down to 13 and the Tree becomes 0/30.
- **Known limits:** Known BACKLOG gap: there are no state-based actions after a mana ability you
  activate by hand, so a Wall of Roots taken to toughness 0 by its own counter stays on the
  battlefield until the next spell or ability is cast or resolves. Also, counters put on as a cost
  skip counter replacements and prohibitions (Vizier of Remedies, Solemnity), though no such card is
  in the pool yet.

### Weathered Sentinels

*Rules call* — a6258cda (defender lifted against players who attacked you)

- **Setup:** 3-player game (you, B, C in that turn order). Your battlefield: Weathered Sentinels
  (not summoning sick), a planeswalker (e.g. Ajani, Caller of the Pride), a Grizzly Bears. B and C
  each have a Grizzly Bears that can attack. Start on your turn 1.
- **Do:** 1) On your turn, look at Sentinels' attack options, then attack with nothing. 2) On B's
  turn, B attacks your planeswalker. 3) On C's turn, C attacks you. 4) On your turn, look at
  Sentinels' attack options and attack. 5) Let B and C each take a turn without attacking you, then
  look again.
- **Check:** Turn 1: Sentinels can't attack anyone (defender). After those turns, only C is offered
  as a defender for Sentinels. B attacked your planeswalker, not you, and planeswalkers are never
  offered. When it attacks it gets +3/+3 and indestructible until end of turn (5/8), and keeps
  defender, reach, vigilance and trample. Once B and C have each had a turn without attacking you,
  nobody is offered: it reads each player's most recent turn.
- **Known limits:** Creatures put onto the battlefield attacking (not declared) don't count as
  attacking you. That's intended (the O-Kagachi ruling on the same wording).

## The Tarkir precons, second half: void counters, votes, X costs, "as long as" (2026-10-03, third round)

### Tasigur, the Golden Fang, Colossal Grave-Reaver

*New decision* — 61e6bf33 (choose-opponent, an opponent's choice, Grave-Reaver's put-arrived); 41672c92 (forPlayer: the opponent's popup names whose hand); 7754b772 (BACKLOG notes)

- **Setup:** 3 players (A = you, B and C opponents), B and C human-seated so their prompts can be
  seen. Your main phase. You: Tasigur on the battlefield, plus Forest, Forest, Island, Island
  untapped. Your graveyard: Hill Giant, Grizzly Bears and an Island. Library top two: Serra Angel,
  then a Forest. Run 2 adds Colossal Grave-Reaver on your battlefield, with two creature cards on
  top of your library (Serra Angel, then Craw Wurm).
- **Do:** Run 1: activate Tasigur's {2}{G/U}{G/U}. When asked, pick C as the opponent. As C, pick a
  card. Run 1b: the same in a 2-player game. Run 2 (with Grave-Reaver): activate Tasigur. As the
  chosen opponent, take Serra Angel (just milled) for your hand. Then let Grave-Reaver's trigger
  resolve.
- **Check:** Nothing is targeted when you activate. As it resolves, you mill two first. Then you (A)
  get a choose-modes listing the opponents, and the one you pick gets a popup titled 'Choose a card
  to put into <A's name>'s hand'. It offers every nonland card in A's graveyard, including the card
  just milled and the older Hill Giant and Grizzly Bears, but no lands (rulings: any nonland card,
  not only the milled ones; you choose the opponent, then they choose). The card goes to A's hand
  and stays owned by A. In 2-player no opponent question is asked. Run 2: the mill of two creature
  cards triggers Grave-Reaver once (rule 603.2 batching; its ruling). When that trigger resolves, it
  offers only the creature card still in the graveyard (Craw Wurm), because the one returned to hand
  is gone. With only one card left it is put onto the battlefield without a prompt.
- **Known limits:** BACKLOG (Client/UI): the 'choose an opponent' modes read 'Choose Bob', the
  capitalised seat id, not the player's display name. BACKLOG (bots): a bot asked to pick a card for
  an opponent picks as if for itself, so it hands Tasigur's controller its best card. Use human
  opponents to judge the prompt.

### Selvala's Stampede

*New decision* — 3d0370a3 (council's dilemma vote; reveal-until-count; votesFor)

- **Setup:** 3 players, all human-seated. Your main phase. You: 6 Forests untapped; Selvala's
  Stampede and Serra Angel in hand. Library top in order: Island, Grizzly Bears, Island, Hill Giant,
  Craw Wurm.
- **Do:** Cast Selvala's Stampede. Vote: you 'wild', B 'free', C 'wild'. At the hand prompt, pick
  Serra Angel. Run 2: everyone votes 'free' (no reveal should happen).
- **Check:** Nobody votes until the spell resolves. The vote is asked in turn order starting with
  the caster (A, B, C), each as a two-option prompt ('Vote for wild' / 'Vote for free') with no
  decline (rule 701.38a; ruling: no abstaining). Each voter should be able to see the votes before
  theirs (ruling). With 2 wild votes you reveal until two creature cards: Island, Bears, Island,
  Hill Giant. Bears and Hill Giant enter together, the two Islands are shuffled back with the rest,
  and Craw Wurm is never revealed. Then 'Choose up to 1 card to put onto the battlefield' from your
  hand offers only permanent cards. Serra Angel enters after the revealed creatures (ruling). Enter
  triggers go on the stack only after the spell finishes. Run 2: nothing is revealed for 0 wild
  votes, and you may put up to 3 permanents from hand.
- **Known limits:** AUTHORING: a vote for objects (Council's Judgment) and extra votes (rule
  701.38d) aren't built. Legibility: each vote is logged as a modes-chosen event, which
  client/src/format.ts prints as 'Selvala's Stampede — Bob chose mode(s) 2', not 'voted free'. Check
  whether later voters can tell the earlier votes. If they can't, that's a gap, and BACKLOG doesn't
  list it yet.

### Gix, Yawgmoth Praetor

*New decision* — 8d7040cd (toOpponent combat-damage trigger, discard X with no {X}, cast-now repeat from exiled-this-way); 3ea049d4 (repeat re-offers only the cards first exiled)

- **Setup:** 3 players (A = you, B, C), B human-seated. You: Gix and Grizzly Bears, neither
  summoning sick; 7 Swamps untapped; 4 cards in hand; no land played this turn. B: a Grizzly Bears
  of their own. B's library top three: Grizzly Bears, Forest, Hill Giant. Run 3 adds Rest in Peace
  on your battlefield, and B's library top two become Thrill of Possibility, Hill Giant.
- **Do:** Run 1: attack B with your Bears. On B's turn, B attacks C with their Bears, and later B
  attacks you. Run 2: in your main phase, activate Gix's {4}{B}{B}{B}, Discard X targeting B with X
  = 3. Discard three. Cast Grizzly Bears free, play the Forest, then decline. Run 2b: activate it on
  an opponent's turn instead. Run 3: X = 2, cast Thrill of Possibility free from the exile, and
  discard a card from your hand to pay its cost.
- **Check:** Run 1: your Bears hitting B asks you 'Pay 1 life', with an option to decline. Paying
  puts you at 19 and draws a card. B's Bears hitting C asks B, not you: any creature hitting one of
  Gix's controller's opponents lets its controller pay and draw. B's Bears hitting you asks nobody.
  Run 2: the X picker appears though the cost has no {X}, capped at the cards in your hand. The
  discard prompt asks for exactly X cards. After the three cards are exiled, a cast-now prompt
  offers the spells free and the Forest as a land play. You're offered it again after each one until
  you decline. The Hill Giant you declined stays in exile and can't be played later (ruling: you
  must play them as the ability resolves). Run 2b: the Forest isn't offered off your turn (ruling:
  lands only on your own turn, with a land play left). A spell with {X} is cast at X = 0. Run 3: the
  card you discarded for Thrill goes to exile because of Rest in Peace, and the next offer lists
  only Hill Giant, not that card (3ea049d4).
- **Known limits:** None documented beyond the rulings.

### Lethal Scheme

*New decision* — 9e672721 (convokedBy, for-each-convoker in caster's order); 7754b772 (a copy uses the original's convokers, rule 707.10; connive LKI is 701.50b)

- **Setup:** 2 players, at instant speed (your main phase is easiest). You: 2 Swamps untapped, two
  untapped Grizzly Bears, plus 2 Islands for run 3. In hand: Lethal Scheme, Hill Giant and an
  Island, plus Twincast and three more nonland cards for run 3. Opponent: Serra Angel, and a second
  Serra Angel for run 3. For run 2 the opponent holds Murder with mana.
- **Do:** Run 1: cast Lethal Scheme on the Angel, convoking with both Bears for the {2} and Swamps
  for {B}{B}. When asked, pick the second Bears to connive first. Discard Hill Giant on its connive
  and the Island on the other. Run 2: the opponent Murders the first Bears in response. Have the
  dead one connive first and discard a nonland card. Run 3: with Lethal Scheme on the stack, cast
  Twincast on it, aim the copy at the other Angel, and discard nonland cards every time.
- **Check:** The Angel is destroyed before anyone connives. A choose-modes asks the order, labelling
  each creature 'Grizzly Bears (convoked 1st)' / '(convoked 2nd)' (ruling: one at a time in the
  controller's order). Each connive draws, then discards, and a nonland discard puts a +1/+1 counter
  on that creature only. Nobody acts between the discard and the counter (ruling). Run 2: the dead
  one is labelled '(convoked 1st, gone)'. It still connives: you draw and discard, but no counter
  lands anywhere (rule 701.50b; ruling). Run 3: four connives in all, two from the copy and two from
  the original, so each Bears ends with two counters (rule 707.10; 7754b772).
- **Known limits:** None specific.

### Necropolis Fiend, Moorland Haunt

*New decision* — e8e4dbf3 (exileFromGraveyard with count 'x'); fed228fa (Moorland Haunt, the same cost with a filter)

- **Setup:** 2 players, your main phase. You: Necropolis Fiend (not summoning sick) and 2 untapped
  Swamps. Your graveyard: Grizzly Bears, Hill Giant, Island. Opponent: Serra Angel. Run 2: 3 Swamps
  and only 1 card in your graveyard. Run 3: Moorland Haunt, a Plains and an Island untapped. Your
  graveyard starts with only an Island; then add one creature card, then two.
- **Do:** Run 1: activate the Fiend, set X = 2, target the Angel, and exile the Bears and the Island
  when asked. Run 2: try X = 2. Run 3: look for the Haunt's Spirit ability with no creature card in
  the graveyard, then with one, then with two.
- **Check:** Run 1: the X picker tops out at 2, the lower of your mana and your graveyard. After
  targeting, a popup titled 'Choose 2 cards to exile' lists your graveyard. The chosen cards are
  exiled together and priority comes back to you, on any player's turn (rule 117.3c). The Angel is
  2/2 until end of turn. Run 2: X = 2 isn't allowed (one card to exile). Run 3: the Spirit ability
  isn't offered without a creature card in your graveyard. With exactly one it's exiled without a
  prompt. With two you're asked which. You get a 1/1 flying Spirit.
- **Known limits:** AUTHORING §8 costs: the cards are chosen once the ability is on the stack, as a
  cost paid with priority returned. exileFromGraveyard isn't supported on mana abilities, nor beside
  a discard, a return-to-hand or a sacrifice of several.

### Shigeki, Jukai Visionary

*New decision* — e8e4dbf3 (returnSelfToHand cost; X target cards on an activated ability; targetsFillable floor)

- **Setup:** 2 players, your main phase. You: Shigeki on the battlefield (not summoning sick) and 10
  untapped Forests. Library top four: Forest, Grizzly Bears, Swamp, Hill Giant. Your graveyard:
  Grizzly Bears, Hill Giant, and a legendary card (Baldin, Century Herdmaster).
- **Do:** Activate {1}{G}, {T}, Return Shigeki: put the Swamp onto the battlefield. Then, from hand,
  open Shigeki's channel options and activate it at X = 2, trying first to include the legendary
  card.
- **Check:** Shigeki goes to your hand as soon as you activate, as a cost before anyone can respond.
  On resolution all four cards are revealed to everyone. You may put one land onto the battlefield
  tapped (or none), and the other three go to your graveyard. Channel from hand is offered once per
  X: X = 0, 1 and 2 here (X can't be 3 or 4 despite the mana, because there are only two
  nonlegendary cards plus the newly milled ones; recount after the first ability). Each option needs
  exactly X targets, legendary cards aren't targetable, and Shigeki goes to the graveyard as the
  discard cost (ruling). The targets return to hand together.
- **Known limits:** None documented. Note that the first ability fills your graveyard, so the
  channel's X ceiling grows after it.

### Steward of the Harvest

*New decision* — e32e436f (grantsActivatedOfLinkedExile, card-activated ability ref)

- **Setup:** 2 players, your main phase. You: Grizzly Bears (not summoning sick), another Grizzly
  Bears that just entered (summoning sick), and Steward of the Harvest in hand with mana. Your
  graveyard: Forest, Evolving Wilds, Island. Have a 1-mana green spell in hand to test paying with a
  creature.
- **Do:** Cast Steward. For its enters trigger, target the Forest and Evolving Wilds. Then open the
  old Bears' abilities, tap it for {G}, and try to pay for the green spell with it. Next, activate
  the Evolving Wilds ability on a creature. Finally, kill the Steward and look at the Bears'
  abilities again.
- **Check:** The target prompt allows up to three land cards from your graveyard only. Afterwards
  every creature you control lists '{T}: Add {G}' (a Forest's built-in mana ability, ruling) and
  Evolving Wilds' '{T}, Sacrifice…: search' ability. Opponents' creatures don't get them.
  Summoning-sick creatures, the Steward included, can't use the {T} abilities (rule 302.6). Tapping
  for {G} adds G. Check whether the payment helper offers the creature as a mana source. Evolving
  Wilds' ability sacrifices the creature that used it, not a land (ruling: a name means the
  creature). With the Steward gone the abilities disappear, and the lands stay in exile.
- **Known limits:** AUTHORING §5: only abilities that work on the battlefield are granted (none with
  a zone). Triggered and static abilities of the lands never pass on (ruling).

### Sepulchral Primordial, Diluvian Primordial

*New decision* — fed228fa (look-and-choose zone 'targets'; cast-now from 'targets' with repeat; one {seat} slot per opponent)

- **Setup:** 3 or 4 players. B's graveyard: Hill Giant, Serra Angel, Lightning Bolt. C's graveyard:
  Grizzly Bears, Shock. You: both Primordials in hand with mana (or put each onto the battlefield
  with its enters trigger). For the one-entry check, also put Ingenious Artillerist on your
  battlefield (it triggers on one or more artifacts entering) and Ornithopters in B's and C's
  graveyards.
- **Do:** Sepulchral: on its enters trigger, fill the slots (Hill Giant for B, Grizzly Bears for C)
  and try putting C's card in B's slot. On resolution, choose only the Bears. Repeat with the two
  Ornithopters and choose both. Diluvian: target Lightning Bolt (B) and Shock (C). On resolution,
  cast Shock first at C, then cast or decline the Bolt.
- **Check:** The target prompt has one optional slot per opponent, worded by seat ('creature card in
  the next opponent's graveyard', 'the opponent 2 seats on's graveyard'; check that it reads
  clearly). Each slot accepts only that player's cards and can be skipped. Sepulchral: on resolution
  a popup 'Choose up to 3 cards to put onto the battlefield' offers only the targeted cards still
  there. The chosen cards enter under your control together (ruling), so Ingenious Artillerist
  triggers once for both Ornithopters (one 2-damage hit each to B and C). Diluvian: the cast-now
  prompt lets you pick which target to cast first, free (X = 0), timing ignored, each one optional.
  After you cast Shock, only the Bolt is re-offered. A card you decline stays in its owner's
  graveyard. If both are cast, the last one cast resolves first (ruling). Each spell is exiled after
  resolving, or if countered, instead of going to a graveyard.
- **Known limits:** fed228fa / target.ts: slots are bound to seats 1–3 (four players at most). A
  player who has left keeps their seat with nothing to target.

### Combustible Gearhulk

*New decision* — fed228fa (an each-player-may of two outcomes asked of the target opponent; thisWay milled sumOf mana-value)

- **Setup:** 2 players (human opponent). You: Combustible Gearhulk in hand with {4}{R}{R}. Library
  top three: Fireball, Grizzly Bears, Hill Giant. Run 3: only 2 cards left in your library.
- **Do:** Cast the Gearhulk and target the opponent. Run 1: the opponent picks 'Have them draw three
  cards.' Run 2: the opponent picks the mill option. Run 3: the opponent picks the draw.
- **Check:** The opponent, not you, gets a two-option prompt as the trigger resolves. Run 1: you
  draw 3 and the opponent's life is unchanged. Run 2: you mill those three and the opponent takes 7
  = Hill Giant 4 + Bears 2 + Fireball 1 ({X} counts as 0; ruling). The damage comes from the
  Gearhulk. Run 3: the draw is still offered (ruling), and you lose to the empty-library draw when
  state-based actions are checked.
- **Known limits:** None documented. A bot opponent answers automatically, so use a human seat to
  see the prompt.

### Dauthi Voidwalker

*Rules call* — 61e6bf33 (shadow, withCounters void, choose-exiled-to-play); 7754b772 (void counter only for the chooser it serves, rule 616.1)

- **Setup:** 2 players. You: Dauthi Voidwalker (not summoning sick), a Grizzly Bears, Murder plus
  mana. Opponent: Grizzly Bears, a Goblin token, Think Twice in their graveyard and 3 untapped
  Islands, and a sorcery in hand to cast on their turn. Later steps add Rest in Peace on the
  opponent's side.
- **Do:** 1) Attack with Dauthi. 2) Murder their Bears, then kill your own Bears and their Goblin
  token. 3) The opponent casts Think Twice by flashback. 4) Let the opponent resolve a sorcery on
  their turn. 5) Give the opponent Rest in Peace and kill another of their creatures. 6) On your
  main phase, tap and sacrifice Dauthi with one void card in exile, and again with two or more.
- **Check:** 1) Only shadow creatures may block Dauthi, and Dauthi can block only shadow creatures
  (rule 702.28b). The card shows the shadow glyph. 2) Their Bears goes to exile with a visible void
  counter instead of dying, so nothing sees it die (ruling). Your own Bears goes to your graveyard.
  Their token still dies (ruling). 3) The flashback spell is exiled by flashback, with no void
  counter, because the opponent picks which replacement applies (rule 616.1; 7754b772). 4) Their
  resolved sorcery is exiled with a void counter. 5) With Rest in Peace (theirs), their creature is
  exiled without a void counter: their choice. 6) With one void card it's chosen automatically. With
  two or more, a popup 'Choose a card you may play' lists only opponent-owned exiled cards with void
  counters. The chosen card is playable this turn only, only without paying its mana cost (X = 0,
  additional costs still paid), and at normal timing. A land uses your land play (rulings). Cards
  exiled without a counter aren't offered.
- **Known limits:** AUTHORING §8 (replacements): the 616.1 choice between Dauthi's exile and another
  exiling replacement isn't put to the player as a prompt. The engine picks for the chooser, taking
  the void counter only when the counter is theirs to use.

### Territorial Hellkite, Scourge of the Throne

*Rules call* — 9e672721 (attack-random-opponent, firstTimeEachTurn, most-still-attacking intervening if); 7754b772 (Scourge gone before resolving is read as it left)

- **Setup:** 3 players: you A at 20, B at 40, C at 20. Your turn, precombat main. You: Territorial
  Hellkite and Scourge of the Throne, both able to attack, and Revitalize plus {1}{W} for run 3. Run
  4 (2 players): Hellkite alone over several of your turns. Run 5 (3 players): B controls Propaganda
  and you have no spare mana.
- **Do:** Run 1: go to combat. Attack with the Hellkite where it must go and Scourge at B. Let
  Scourge's trigger resolve, then attack in the additional combat (Hellkite where told, Scourge at B
  again). Run 3: while Scourge's trigger is on the stack, cast Revitalize, then raise your life
  above B's (scenario builder if needed). Run 4: attack with the Hellkite on turns N, N+2 and N+4.
  Run 5: at the beginning of combat, note the random pick. If it's B (Propaganda), try to attack C
  instead.
- **Check:** At the beginning of combat the log reads '<player> is chosen at random: Territorial
  Hellkite attacks them this combat if able'. The attack bar should start the Hellkite assigned to
  that player and refuse another defender. Scourge at B (most life) gets a dethrone counter. Its
  second trigger untaps all attacking creatures and adds a combat after this one. In the additional
  combat the Hellkite triggers again and must pick the other opponent, the one it didn't attack
  during your last combat. Scourge gets dethrone again but no third combat (not its first attack
  this turn). Run 3: dethrone's counter stays (ruling), but the untap and extra combat don't happen,
  because the intervening if is checked again on resolution (rule 603.4). Run 4 (2 players): turn N
  attacks B. At N+2 nobody can be chosen and the Hellkite taps itself. At N+4 (it didn't attack last
  combat) B is chosen again. Run 5: per rule 508.1d and the ruling, if attacking the chosen player
  costs something, the Hellkite is free to attack the other opponent or stay home.
- **Known limits:** AUTHORING (attack-random-opponent): 'nothing forces a cost to be paid'.
  Suspected bug for run 5: from reading engine/src/combat/eligibility.ts, attackRequirementsForbid
  ignores attack taxes. With Propaganda the Hellkite seems to be offered only the chosen B (pay or
  stay home), not C, which contradicts the ruling. The same may affect encore tokens.

### Opportunistic Dragon

*Rules call* — 59220166 (while-source duration, rule 611.2b; leave batches and 603.10a); 3ea049d4 (a blink within one event ends the old stint's effects, rule 400.7)

- **Setup:** 2 players. Opponent: Syr Konrad, the Grim (a Human) and Sol Ring; Murder and Threaten
  (or Act of Treason) with mana. You: Opportunistic Dragon in hand with {2}{R}{R}, and Cloudshift
  with {W}.
- **Do:** Run 1: cast the Dragon and target Konrad. Pass to your next turn. Then the opponent
  Murders the Dragon. Run 2: steal Konrad, then Cloudshift the Dragon and target Sol Ring with the
  new trigger. Run 3: steal Konrad, then the opponent Threatens the Dragon. Run 4: kill the Dragon
  in response to its enters trigger.
- **Check:** Run 1: you control Konrad with no abilities and it can't attack or block. The log
  doesn't say 'this turn'. It lasts into later turns. When the Dragon dies, Konrad goes back with
  his abilities, and he doesn't trigger on the Dragon's own death, because the abilities were gone
  at that moment (ruling; rule 603.10a). The next creature death does ping. Run 2: Cloudshift ends
  the old effect at once (Konrad back, abilities back). The new trigger's target is under the new
  Dragon's stint. Run 3: you keep Konrad, still ability-less, while the opponent controls the Dragon
  (ruling: it lasts until the Dragon leaves the battlefield). Run 4: nothing happens at all, and
  Konrad never changes hands (ruling; 611.2b).
- **Known limits:** None documented.

### Chandra's Ignition, Arachnogenesis

*Rules call* — fed228fa (DamageFrom a target slot's creature; prevent-all-combat-damage 'by' filter); 3ea049d4 (a simultaneous sequence's damage is one event, so lifelink gains once)

- **Setup:** Ignition: 2 or 3 players, your main phase. You: Vampire Nighthawk (2/3 flying,
  deathtouch, lifelink), a Grizzly Bears, 5 Mountains, Chandra's Ignition in hand. Opponent(s):
  Serra Angel, Craw Wurm, 20 life. Arachnogenesis: on the opponent's turn, with B attacking you with
  Grizzly Bears and Hill Giant (in 3 players, plus a creature attacking C). You: 3 Forests and
  Arachnogenesis.
- **Do:** Ignition run 1: cast it targeting Nighthawk. Run 2: the opponent kills the Nighthawk in
  response. Arachnogenesis: in the declare attackers step, cast it, then block the Bears with a
  Spider.
- **Check:** Ignition: your Bears and every opponent creature die (deathtouch), each opponent goes
  to 18, and Nighthawk takes no damage. You gain 8 life (2 × 3 creatures + 2 per opponent) in one
  life gain, a single log line, because it's one damage event (3ea049d4). The creature is the
  source, not the spell (ruling). Run 2: nothing happens at all (ruling; 608.2b). Arachnogenesis: X
  counts only creatures attacking you, not one attacking another player or your planeswalker (rule
  506.3), so you get two 1/2 reach Spiders. You take no combat damage. The blocking Spider deals its
  1 to the Bears while the Bears' damage to it is prevented. The log says 'Arachnogenesis: some
  combat damage is prevented this turn'.
- **Known limits:** None documented.

### Baloth Prime, Pugnacious Hammerskull, Junk Winder

*Rules call* — fed228fa (stun counters, rule 122.1d; tap doesntUntapNext; a trigger-time 'while' condition); 3ea049d4 (rulings pinned: Baloth sacrificed with lands, Dinosaur arriving late, one trigger per stacked token)

- **Setup:** 2 players. You: Baloth Prime in hand with {3}{G}, 5+ lands to sacrifice and pay {4};
  Pugnacious Hammerskull (not summoning sick); Ancient Brontodon in hand; Junk Winder on the
  battlefield and Raise the Alarm (makes two 1/1 Soldier tokens). Opponent: Grizzly Bears, Hill
  Giant, Serra Angel.
- **Do:** Cast Baloth Prime and pass to your next turn. Activate {4}, Sacrifice a land. Attack with
  the Hammerskull alone, then on a later turn attack with the Brontodon also out, and once put the
  Brontodon in with the Hammerskull's trigger on the stack. Cast Raise the Alarm with Junk Winder
  out, target two opponent permanents, and watch their next untap steps.
- **Check:** Baloth enters tapped with 6 stun counters shown on the card. Each untap step removes
  one instead of untapping it. The land-sacrifice trigger makes a tapped 4/4 Beast and removes
  another stun counter rather than untapping Baloth. Only after the counters run out does it untap.
  If Baloth is sacrificed together with lands, it still triggers for each land (ruling). Hammerskull
  attacking without another Dinosaur gets a stun counter and stays tapped through your next untap
  step, which spends the counter. With the Brontodon already out it gets no counter. A Dinosaur
  arriving after the attack doesn't stop the counter (ruling: the condition is checked on trigger).
  Junk Winder: two token triggers, each tapping its target. Those permanents stay tapped through
  their controller's next untap step and untap the one after.
- **Known limits:** None documented.

### Neriv, Crackling Vanguard

*Rules call* — 41672c92 (distinctTokenNames, rule 111.4; attacked-with-commander-this-turn); 7754b772 (named tokens and copies counted by their 111.4 names)

- **Setup:** Commander game, 2+ players. You: Neriv as your commander on the battlefield (not
  summoning sick). Tokens you control: two Goblin tokens (from Neriv's enters trigger), a Treasure,
  and two Angel tokens from different sources. Opponent: a Food token. Run 2: Neriv in the 99, with
  your real commander on the battlefield able to attack.
- **Do:** Run 1: attack with Neriv, then try to play the exiled cards that turn. On your next turn
  try again before attacking, then attack with Neriv and try again. Run 2: attack with Neriv but not
  your commander, then on another turn attack with both.
- **Check:** Neriv exiles one card per differently named token you control. Goblin, Treasure and
  Angel make 3: two of the same name count once, and an opponent's token doesn't count (ruling; rule
  111.4 names). The exiled cards are playable only during a turn you attacked with a commander, and
  stay playable for as long as they stay exiled. They're not playable next turn until a commander
  has attacked that turn. Run 2: after a non-commander Neriv attacks, the cards aren't playable
  until your commander attacks that turn.
- **Known limits:** None documented.

### Living Death

*Rules call* — 9e672721 (exile-graveyard filter, sacrifice-all, put-exiled-this-way-onto-battlefield)

- **Setup:** 2 players, your main phase. You: 5 Swamps, Living Death in hand, Hill Giant on the
  battlefield, Grizzly Bears in your graveyard. Opponent: Serra Angel on the battlefield, Craw Wurm
  and an Island in their graveyard. Run 2: the opponent also controls Rest in Peace.
- **Do:** Cast Living Death (once without Rest in Peace, once with it).
- **Check:** Run 1: Grizzly Bears enters under your control and Craw Wurm under the opponent's. Hill
  Giant and Serra Angel go to graveyards. The Island stays put. Each step happens for everyone at
  once, and the creatures enter together (ruling). Run 2: Grizzly Bears still returns, but Hill
  Giant, exiled by Rest in Peace as it was sacrificed, stays in exile. Only cards the first
  instruction exiled come back (ruling).
- **Known limits:** None documented.

## Exiling from the top of a library (2026-10-03, animation)

### Reckless Impulse, Bloodbraid Elf, Ulamog, the Ceaseless Hunger, Pako, Arcane Retriever

*Animation* — exile-anim (cards leaving a library peel like a mill)

- **Setup:** `npm run dev-rooms -w server`, then room `EXILE` (2 players) or `EXIL4` (4). Alice
  has Reckless Impulse, Bloodbraid Elf, Outrageous Robbery and Watcher for Tomorrow in hand, Mystic
  Forge, Ulamog and Pako on the battlefield, and 15 lands; her library is stacked so a cascade exiles
  a few lands before it finds Divination.
- **Do:** Cast Reckless Impulse; activate Mystic Forge; cast Bloodbraid Elf (a fresh room, so the
  cascade runs through five cards); cast Outrageous Robbery with X=3 at bob; cast Watcher for
  Tomorrow and hide a card; attack bob with Ulamog and Pako. Try Settings at half and double speed
  and with reduced motion, and at 1366x768 and 2560x1440.
- **Check:** Each exile peels cardbacks off that library's pile one after another, flaring
  white-blue (a mill drops away darkening, and its waiting cards stay purple, not black), each off
  the top of the ones still waiting, while "library N" counts down card by card and "exile N" up —
  and so does the number on the pile itself, rather than vanishing under the peels and jumping —
  with one "−N exiled" floating up off the top of the pile's card, clear of that number. The
  cascade's five one-card exiles read as one run of five, not five cards at once. Ulamog's twenty peel eight cards with bob's
  count running 52 → 32; Pako peels every library's top card side by side. The peel is
  card-shaped at every size, over the revealed top card where Mystic Forge shows it. Reduced
  motion fades the cards in place.
- **Known limits:** Cascade's misses going back to the bottom aren't animated: the counts that ran
  down jump back when the board lands (`BACKLOG.md`, Legibility of play).

## Token stacks folding back (2026-10-03)

### Tribute to the World Tree, Secure the Wastes, Thalisse, Reverent Medium, Simic Ascendancy, Basri's Solidarity

*Rules call* — stack-counters (tokens split off a stack fold back once identical; counters on a
stack count once per token)

- **Setup:** dev-rooms `TREES` (2 players: a stack of ten Warrior tokens, Tribute to the World Tree,
  Secure the Wastes in hand) and `TREE4` (4 players: Tribute, Secure the Wastes, 12 lands). For the
  counts: Thalisse, Reverent Medium and Simic Ascendancy on your side, Basri's Solidarity in hand.
- **Do:** Cast Secure the Wastes for 3 in `TREES` and for 10 in `TREE4`, and let Tribute's triggers
  resolve. Then cast Basri's Solidarity, and pass to your end step.
- **Check:** `TREES`: one ×10 Warrior tile at 1/1 and one ×3 tile at 3/3 with a "+1/+1 2" chip, not
  three separate 3/3 tiles. `TREE4`: one ×10 tile at 3/3 with its chip once the last trigger
  resolves. Each Warrior got exactly two counters (none got four, none none). Basri's Solidarity
  puts one counter on every Warrior and Simic Ascendancy gets one growth counter per Warrior, not
  per tile. At the end step Thalisse makes one Spirit per token you created this turn.
- **Known limits:** While the triggers resolve the stack splits a Warrior at a time; it folds back
  only once nothing is waiting. A per-token trigger that grants an effect instead (Rapid Augmenter's
  haste) keeps the tokens apart until cleanup, each grant having its own timestamp, and so does
  attacking: Warriors that attacked stay separate objects until cleanup (a tile each once they carry
  counters), so that a second
  combat doesn't count them again as new attackers (`BACKLOG.md`). Counters landing
  on tokens that fold away in the same frame don't float their "+1/+1 ×2" (`BACKLOG.md`).

## Choices on resolution: populate, amass, sacrifice-then (2026-10-03, UI round)

### Trostani, Selesnya's Voice

*New decision* — the UI round (choose-permanent, may-sacrifice-then)

- **Setup:** Trostani on your battlefield, untapped, with {1}{G}{W} available; an Elephant token
  (3/3) and a Soldier token (1/1) of yours; an opponent's creature token.
- **Do:** Activate Trostani's populate ability.
- **Check:** A choice on the board appears in the decision banner offering only your two creature
  tokens (not the opponent's, not nontoken creatures); picking the Soldier makes a second Soldier,
  not an Elephant. With only one kind of token (even several identical ones) nothing is asked and
  one more is made. When another creature you control enters, you gain life equal to its toughness.
- **Known limits:** Tokens alike in everything but when they were made count as one choice.

### Saruman, the White Hand, Changeling Outcast

*New decision* — the UI round (choose-permanent, may-sacrifice-then)

- **Setup:** Saruman and an Orc Army token with a +1/+1 counter on your battlefield, plus Changeling
  Outcast (a changeling is an Army); Divination in hand with three Islands.
- **Do:** Cast Divination.
- **Check:** Saruman's trigger amasses 3: a choice on the board offers the Army token and Changeling
  Outcast; the one picked gets three +1/+1 counters and becomes an Orc. With a single Army nothing
  is asked. A creature spell doesn't trigger it. Goblins and Orcs you control (the Army) have ward
  {2}.

### Wick, the Whorled Mind

*New decision* — the UI round (choose-permanent, may-sacrifice-then)

- **Setup:** Wick on the battlefield; two Snail tokens, one with a +1/+1 counter; Muck Rats in hand.
  Separately, {U}{B}{R} available.
- **Do:** Cast Muck Rats. Then activate Wick's ability, sacrificing a Snail.
- **Check:** When a Rat enters with Snails out, a choice on the board offers your Snails (only
  Snails) and the one picked gets a +1/+1 counter; with no Snail, a 1/1 Snail is made instead.
  Sacrificing a 3-power Snail deals 3 to each opponent and draws 3 (its power as it last existed).

### Breena, the Demagogue

*New decision* — the UI round (choose-permanent, may-sacrifice-then)

- **Setup:** Three players. You control Breena and a Hill Giant. Bob has 10 life, Carol 20. On Bob's
  turn he attacks Carol.
- **Do:** Let Bob attack Carol.
- **Check:** Breena triggers: Bob draws a card and you are asked (on the board, in your banner, on
  Bob's turn) which of your creatures gets two +1/+1 counters. If Carol had less life than Bob,
  nothing triggers. It still triggers, and Bob still draws, if you control no creature.

### Abdel Adrian, Gorion's Ward

*New decision* — the UI round (choose-permanent, may-sacrifice-then)

- **Setup:** Sol Ring, Grizzly Bears and a Plains on your battlefield; Abdel Adrian in hand.
- **Do:** Cast Abdel Adrian and choose both nonland permanents. Then destroy Abdel Adrian.
- **Check:** The choice offers Sol Ring and the Bears — never Abdel himself or the land, any number
  including none. Each one chosen is exiled and a 1/1 Soldier made for it; when Abdel leaves, they
  return (under their owners' control) and the Soldiers stay. An exiled token never returns but
  still made a Soldier.

### Ziatora, the Incinerator, Felothar, Dawn of the Abzan

*New decision* — the UI round (choose-permanent, may-sacrifice-then)

- **Setup:** Ziatora and a Grizzly Bears with three +1/+1 counters on your battlefield. Separately:
  Felothar in hand, Sol Ring and a Grizzly Bears out.
- **Do:** Go to your end step with Ziatora; cast Felothar.
- **Check:** Ziatora asks whether to sacrifice another creature (never Ziatora itself; not asked at
  all if it's your only creature); once you do, a separate ability goes on the stack asking for a
  target, dealing 5 (the Bears' last power) and making three Treasures. Felothar asks to sacrifice a
  nonland permanent (lands not offered); then a +1/+1 counter on each creature you control, Felothar
  included.
