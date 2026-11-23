# Справочник: как собрать и обновить

Справочник — один файл `blood-oracle-rules.json` в папке Foundry
`Data\blood-oracle\`. В нём всё сразу: правила, силы, мериты, лоршиты,
тултипы трейтов, тексты коттери и отдельные разделы охотников и оборотней. Это почти дословный текст книг, поэтому в
репозиторий и в релиз он не попадает никогда.

## Источники

Все исходники держи в одной папке вне репозитория, например
`E:\VtM\Tools\reference-sources`:

| Файл | Что из него берётся |
|---|---|
| `blood_oracle.jsx` | правила, силы, кланы, предаторы, мериты — **обязателен** |
| `loresheets_vtm_vNN.xlsx` | лоршиты |
| `attributes_vtm_vNN.xlsx` | тултипы атрибутов, навыков и домена коттери |
| `coterie_types_vNN.xlsx` | типы коттери |
| `coterie_advantages_vNN.xlsx` | мериты и флоу коттери, клановые мериты, справка |
| `blood-oracle-hunter-rules.json` | справочник охотников |
| `blood-oracle-werewolf-rules.json` | справочник оборотней |

Если в папке лежит несколько версий одной таблицы, берётся та, у которой
больше номер `_vN`. Старые версии можно не удалять.

## Собрать

Из корня репозитория (`E:\VtM\Tools\blood_oracle_foundry_module`), в обычном
окне PowerShell:

```powershell
node tools\build-reference.mjs E:\VtM\Tools\reference-sources E:\dnd\foundry\Data\blood-oracle\blood-oracle-rules.json
```

Скрипт покажет, из какого файла собран каждый раздел, и в конце напишет,
какие вампирские таблицы пропущены. Разделы охотников и оборотней берутся
из папки источников, затем из существующего целевого файла или из отдельных JSON
рядом с ним, если раздела в нём ещё нет.

Потом в Foundry — Ctrl+F5. Перезапускать сервер не нужно.

## Если в таблице появились новые записи

Новые лоршиты, типы коттери или мериты коттери — это не только тексты, но и
названия, которые живут в самом модуле. Тогда добавь в конец команды
`--catalogues`:

```powershell
node tools\build-reference.mjs E:\VtM\Tools\reference-sources E:\dnd\foundry\Data\blood-oracle\blood-oracle-rules.json --catalogues
```

Скрипт перепишет файлы в `src\app\rules\`. Закоммить их и пересобери модуль.
Если поменялись только тексты описаний, `--catalogues` не нужен.

## Объединение готовых справочников

Если три файла уже лежат в Foundry, ключ `--merge` добавит охотников и оборотней
в основной справочник с сохранением существующих вампирских таблиц.

```powershell
node tools\build-reference.mjs E:\dnd\foundry\Data\blood-oracle E:\dnd\foundry\Data\blood-oracle\blood-oracle-rules.json --merge
```

Отдельные JSON держи по прежним путям, пока используются старые версии модуля.
В актуальном модуле приоритет у разделов из единого справочника. При обновлении
правил охотников или оборотней обновляй и отдельные экспорты для старых версий.

## Арт

Картинки в справочник не входят: они лежат папкой рядом с ним,
`Data\blood-oracle\art\disciplines\<ключ>.webp` (подойдут и `.png`, `.jpg`).
Ключи дисциплин: `animalism`, `auspex`, `celerity`, `dominate`, `fortitude`,
`obfuscate`, `oblivion`, `potence`, `presence`, `protean`, `sorcery`,
`alchemy`, `rituals`, `ceremonies`.
