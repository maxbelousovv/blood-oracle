# Rules reference

The rules reference is **not** part of this module and must never be committed
to a repository or bundled into a distributed package. It is close to verbatim
rulebook text across some thirty books. The module works without it — every
field can be entered by hand — so treat it as a private convenience.

## Generating the file

The same build combines the Vampire tables with the Hunter and Werewolf rules.
Keep the source files in a private folder outside the repository.

| Source | Holds |
|---|---|
| `blood_oracle*.jsx` | the standalone app: rules, powers, clans, predators, merits |
| `loresheets*.xlsx` | loresheet descriptions and levels |
| `attributes*.xlsx` | attribute, skill and coterie-domain tooltips |
| `coterie_types*.xlsx` | coterie types |
| `coterie_advantages*.xlsx` (or `.csv`) | coterie merits, flaws and rules notes |
| `blood-oracle-hunter-rules.json` | the Hunter section |
| `blood-oracle-werewolf-rules.json` | the Werewolf section |

```bash
node tools/build-reference.mjs path/to/sources Data/blood-oracle/blood-oracle-rules.json
```

When a folder holds several versions of one source, the highest `_vN` is used.
The standalone app is required for a full rebuild. The build reports any missing
Vampire tables. Hunter and Werewolf sections are taken from the source folder,
then from the existing output file, then from companion files beside the output. Add `--catalogues` (run from the repository) to regenerate the
names that ship with the module under `src/app/rules` when a table gains or
renames loresheets, coterie types or coterie merits, and commit those files.

The single extractors (`extract-rules.mjs`, `extract-loresheets.mjs`,
`extract-traits.mjs`, `extract-coterie-types.mjs`,
`extract-coterie-advantages.mjs`) still work on their own; the build runs them
and merges their output. Older builds wrote loresheets, tooltips and coterie
texts to separate files beside the reference; the module still reads those
when the reference lacks the section, so nothing breaks before you rebuild.

The app extractor maps discipline display names onto the system's keys (Blood
Sorcery becomes `sorcery`, Thin-Blood Alchemy becomes `alchemy`), strips
amalgam suffixes from power names while keeping the requirement, and folds
rituals and ceremonies into the two pseudo-disciplines wod5e provides for them.

## Installing it

Copy the JSON somewhere under Foundry's Data directory, for example:

```
Data/blood-oracle/blood-oracle-rules.json
```

Then set **Rules reference file** in the module settings to that path, relative
to Data. The default matches the example above. Leave the setting empty to run
without a reference.

Foundry serves the Data directory over HTTP, so every connected client fetches
the same file. Players get the reference without any further setup, and
replacing that one file updates everyone on their next reload.

Put the file in a directory of its own rather than inside the module folder —
reinstalling or updating the module would otherwise delete it.

## Combining existing references

With the three JSON files in the Foundry data folder, run the builder with
`--merge` to keep the current Vampire tables and import the two companion exports.

```bash
node tools/build-reference.mjs Data/blood-oracle Data/blood-oracle/blood-oracle-rules.json --merge
```

Keep the companion files at their original paths while older clients are in
use. Clients that read the unified file use the embedded sections. If an older
build reads the companion files directly, update those exports alongside the
unified file when their rules change.

## What the reference changes

- **Power form** gains a search box that fills every field from a reference
  entry. The fields stay editable afterwards.
- **Import** resolves levels and rules text for powers that arrive as bare
  names. Without a reference they import at level 0 with no text.
- **Prerequisites** can be checked. Amalgams are read from the power's own
  name and work without a reference; prose prerequisites like
  "Cloak of Shadows or Unseen Passage" need one, and are reported as unknown
  rather than unmet when it is missing.
- **Discipline detail** shows the overview, type, Masquerade threat and
  resonance.
- **Merits & flaws** gain the catalogue picker, grouped by category, with the
  book's rating range carried alongside the rating the character bought.
- **Blood tab** gains the clan list, bane and compulsion text, the Humanity
  penalty for the current rating, Blood Potency range for the generation, and
  the predator type breakdown. Without a reference the clan is typed by hand
  and the descriptive text is simply absent.

## Known gaps in the source data

Seven entries have no rules text, because they appear in the app's power lists
but not in its rules table:

- Thin-Blood Alchemy: Counterfeit Discipline, Saraimu
- Rituals: Bloody Message, Letter Ward, Sanguine Tidings, Sleep of Judas,
  Seek the Gathered Vitae

They still import and can be filled in by hand.

## The tables

Each table's columns and formats are described in its own help sheet ("Как
заполнять") where it has one, and in the header comment of its extractor in
`tools/`. In short:

- **Loresheets:** name, description, the five levels as "Level name: text",
  and the restriction in brackets in a comment column, such as
  "(Ventrue characters only)".
- **Attributes:** every sheet is read, each with a header row — attributes and
  skills on one, Chasse, Lien and Portillon on another. Columns: name,
  description, example specialties separated by commas. Traits match by name
  with spaces dropped ("Animal Ken" is `animalken`).
- **Coterie types:** type, description, Chasse, Lien, Portillon, backgrounds,
  flaws, choices, possible extras.
- **Coterie advantages:** a sheet of coterie merits and flaws (name, cost,
  description, group — or `rules` for a rules note) and a sheet of clan
  coterie merits (clan, name, cost, description, summary).

## Art

Illustrations are private too: a folder beside the rules reference, looked up
by name. Nothing is configured; a file that exists is shown, and a missing one
leaves the panel as it was.

```
Data/blood-oracle/art/disciplines/<key>.webp
```

`.png` and `.jpg` are found as well, in that order after `.webp`. About 512
pixels on the long side is plenty. The art appears as a thumbnail in the
corner of the discipline's detail panel; clicking it opens Foundry's image
window, where the Storyteller can show it to every player.

Discipline keys are the system's own: `animalism`, `auspex`, `celerity`,
`dominate`, `fortitude`, `obfuscate`, `oblivion`, `potence`, `presence`,
`protean`, `sorcery` (Blood Sorcery), `alchemy` (Thin-Blood Alchemy), and the
pseudo-disciplines `rituals` and `ceremonies`. A custom
discipline uses the id shown in its world setting.
