# Architecture

- `app/`: Expo Router screens and tab navigation.
- `components/`: reusable UI, including the fixed header and HTML response view.
- `hooks/`: React state and storage hooks.
- `services/`: network and use-case services.
- `types/`: shared API and settings contracts.
- `.github/workflows/`: CI and release automation.
- `app.json`: static Expo app identity and native version configuration.
- `eas.json`: EAS build and submit profiles.

The Excel-defined API contract remains the source of truth. `sendUrl` is a destination only except for `usetype=A`, where it is an explicit POST field.
