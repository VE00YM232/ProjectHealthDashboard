
# KPI Dashboard (Client)

This is the client-side React application for the KPI Dashboard, built on top of Black Dashboard React and extended with custom features for hierarchical KPI navigation and visualization.

## Key Features

- **Dynamic Collapsible Sidebar**
    - Sidebar displays Years → Months → Projects → Releases, all fetched dynamically from backend data.
    - Multi-level collapsible navigation with custom styling (`Sidebar.css`).
    - Sidebar state persists while navigating.

- **Global Context for KPI Data**
    - Uses a custom `GlobalContext` to fetch and provide all KPI data to components.
    - Data is loaded from `/getAllKPIData` endpoint and available throughout the app.

- **Dashboard & MonthDashboard Views**
    - `Dashboard.js`: Shows KPIs, charts, and tables for the selected project/release.
    - `MonthDashboard.js`: Aggregated monthly view for all projects in a month.

- **Routing**
    - Uses `react-router-dom@6` for navigation.
    - Custom routes for dashboard, month, and project views.

- **Custom Styling**
    - `src/assets/css/Sidebar.css` for sidebar theming and UX improvements.

- **Modern React & Bootstrap**
    - Uses React functional components, hooks, and Bootstrap 4 via Reactstrap.
    - Chart visualizations via Chart.js and react-chartjs-2.

## File Structure (Client)

```
client/
├── src/
│   ├── assets/
│   │   └── css/
│   │       └── Sidebar.css         # Custom sidebar styles
│   ├── components/
│   │   └── Sidebar/
│   │       └── Sidebar.js         # Collapsible sidebar (Years → Months → Projects)
│   ├── contexts/
│   │   └── GlobalContext.js       # Global KPI data context
│   ├── views/
│   │   ├── Dashboard.js           # Main dashboard view (per project/release)
│   │   └── MonthDashboard.js      # Monthly aggregated dashboard
│   ├── routes.js                  # Route definitions
│   └── ...
├── public/
└── package.json
```

## How It Works

1. **Sidebar**: Fetches all KPI data from the backend and builds a collapsible navigation tree (Year → Month → Project → Release). Clicking a release routes to the dashboard for that selection.
2. **GlobalContext**: Handles fetching and providing KPI data to all components. Supports reloading data.
3. **Dashboard**: Displays charts and tables for the selected project/release. If nothing is selected, prompts user to select from sidebar.
4. **MonthDashboard**: Shows all projects for a selected month, with charts and tables.
5. **Custom CSS**: Sidebar is styled for clarity and usability, with clear hierarchy and active highlighting.

## Getting Started

1. Install dependencies:
     ```sh
     npm install
     # or
     yarn install
     ```
2. Start the development server:
     ```sh
     npm start
     # or
     yarn start
     ```

## Customization

- To change sidebar structure, update backend data or adjust logic in `Sidebar.js`.
- To add new views, create new components in `src/views` and add routes in `src/routes.js`.
- To update styles, edit `src/assets/css/Sidebar.css`.

