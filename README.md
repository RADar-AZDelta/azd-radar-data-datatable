# RADar-DataTable

*A modular data table component for Svelte*

## Setup for development

Run these commands to get started:

```bash
git clone git@github.com:RADar-AZDelta/RADar-DataTable.git
cd RADar-DataTable
pnpm install
```

To run the example app, run `pnpm run dev --open` from the project root.


# Notes
When you want to use a function from the parent in a child component, give the function as a property to the child.
Don't use EventDispatcher (although it will work) because it isn't a design pattern. EventDispatcher is used for siblings rather than for parent-child.