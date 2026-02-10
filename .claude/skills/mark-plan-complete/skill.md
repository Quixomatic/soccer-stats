# Mark Plan Complete

Marks a plan file as completed by renaming it from `_planname.md` or `!planname.md` to `+planname.md`.

## Usage

```
/mark-plan-complete <plan-name>
```

## Instructions

1. Look for a file matching `_<plan-name>.md` or `!<plan-name>.md` in the `.plans` folder
2. Rename it to `+<plan-name>.md`
3. If the file doesn't exist, list available plans in `.plans` folder

## Example

```
/mark-plan-complete add-player-charts
```

This renames `.plans/_add-player-charts.md` or `.plans/!add-player-charts.md` to `.plans/+add-player-charts.md`
