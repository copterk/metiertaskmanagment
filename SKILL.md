# ProjectFlow Pro - Project Skill

## Overview
**ProjectFlow Pro** is a task monitoring and orchestration platform designed to help teams manage tasks across different departments and phases. It supports multi-phase workflows, team assignments, and timeline visualization.

## Technology Stack
- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS (loaded via CDN in `index.html`)
- **Routing**: React Router DOM v7 (using `HashRouter`)
- **Icons**: Lucide React
- **Fonts**: Inter, Sarabun (Google Fonts)

## Project Structure
The project follows a **flat structure** in the root directory (no `src` folder), which is non-standard but consistent within this project.

### Key Files & Directories
- **`App.tsx`**: Main application entry point. Handles:
  - Global State (`data`, `lang`)
  - Routing (`HashRouter`)
  - Context Providers (`LangContext`)
  - Integration of all pages.
- **`components/`**: Contains all UI components and Page views.
  - `TimelineView.tsx`: The main Gantt-chart style view.
  - `AdminDashboard.tsx`: Task management interface.
  - `TaskModal.tsx`: Form for creating/editing tasks.
- **`types.ts`**: TypeScript definitions. **Consult this file first** when modifying data structures.
  - Key interfaces: `Task`, `TaskPhase`, `User`, `Project`, `Department`.
- **`constants.tsx`**:
  - `TRANSLATIONS`: Localization strings (EN/TH).
  - `COLORS`: Theme colors.
  - `Icons`: Lucide icon exports.
- **`mockData.ts`**: Contains `INITIAL_DATA`. Used to seed the application state.
- **`index.html`**:
  - Loads Tailwind CSS via CDN script.
  - Defines an `importmap` for `esm.sh` imports (though local `node_modules` are also used via Vite).

## Data Management
- **Persistence**: Data is persisted in `localStorage` under the keys:
  - `project_flow_data`: Complete application state (`AppData` interface).
  - `project_flow_lang`: Current language selection (`'en' | 'th'`).
- **State Architecture**:
  - `App.tsx` holds the "source of truth" in `useState`.
  - Data is passed down via props to pages (`data`, `onUpdateData`, etc.).
  - **Note**: There is no global state management library (Redux/Zustand); it uses Prop Drilling and React Context for language.

## Common Workflows

### 1. Running the Project
```bash
npm run dev
```
Runs Vite dev server on port 3000.

### 2. Modifying the Data Model
1.  **Update Interface**: Modify `types.ts` to add new fields.
2.  **Update Initial Data**: Add default values in `mockData.ts`.
3.  **Update State Logic**: Modifying `App.tsx` (e.g., `saveTask`, `deleteTask`) to handle the new fields.
4.  **Reset Data**: Clear your browser's `localStorage` to identify schema changes, as old data might persist.

### 3. Adding a New Page/Route
1.  Create the component in `components/MyNewPage.tsx`.
2.  Import `MyNewPage` in `App.tsx`.
3.  Add a `<Route path="/new-path" element={<MyNewPage ... />} />` inside `<Routes>`.
4.  Add a navigation link in the `<nav>` section of `App.tsx` using the `NavLink` component.

### 4. Localization (i18n)
- The app uses a simple dictionary-based translation system.
- Add new keys to `TRANSLATIONS` in `constants.tsx`.
- Use the `t('key')` function provided by `useLang()` context.

## Conventions & Quirks
- **Styling**: Do not import CSS files for components. Use Tailwind classes directly in JSX `className`.
- **Components**: Functional components with `React.FC`.
- **Imports**: Uses relative imports (e.g., `./components/Foo`) or alias `@/` if configured in Vite.
