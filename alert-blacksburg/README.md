# Alert.Blacksburg — public city intelligence dashboard

A Blacksburg, Virginia / New River Valley companion to Alert.Kraków, with the same dark layout and a protected Leaflet/OpenStreetMap configuration.

## Live integrations

- Open-Meteo weather: temperature, wind, precipitation (forecast-model based).
- Open-Meteo air quality: modeled PM2.5 and US AQI, **not station measurements**.
- National Weather Service API: active alerts for a **single point in central Blacksburg**, with severity, area and expiration.
- Google News RSS: aggregated English-language Blacksburg / Virginia Tech / Montgomery County headlines, where accessible.

## Source links, not ingested incident feeds

- Virginia 511 roads, traffic and public camera map.
- Blacksburg Transit official website.
- Town of Blacksburg notices and NWS Blacksburg forecast office.

The dashboard does not ingest police incidents, protests, Virginia 511 road incidents or transit service alerts. It must **not** be used as an all-clear or a sole source for safety decisions. Camera links are not embedded video.

## Free deployment using Render (no Node.js required on your computer)

1. Extract this ZIP on your computer.
2. Create a new GitHub repository named `Alert.Blacksburg`.
3. Upload the **contents** of this folder to the repository root. Ensure `package.json`, `server.js`, `render.yaml` and `public/index.html` exist at the paths shown.
4. In Render, select **New → Blueprint**, connect the repository and use the included `render.yaml`. Alternatively, create a Node Web Service with build command `npm install`, start command `npm start`, root directory blank, free instance.
5. When Render says **Live**, open its HTTPS URL. The free tier may sleep when idle.
6. Confirm the map renders and inspect the Alerts, Transport and News tabs. Live feeds may be temporarily unavailable; they are labeled accordingly.

### Local test (optional)

`npm install` then `npm start`, visit `http://localhost:3000`.

## Folder structure

- `server.js`: Express backend, cached upstream API calls.
- `public/index.html`: dashboard markup.
- `public/app.js`: frontend feed rendering and map setup.
- `public/styles.css`: complete CSS including the **Leaflet map positioning repair**. Keep the Leaflet stylesheet link before this stylesheet in HTML.
- `render.yaml`: Render deployment blueprint.

The map uses public OpenStreetMap raster tiles subject to the OpenStreetMap Foundation tile usage policy. For significant public traffic, switch to a tile provider with suitable terms and capacity.
