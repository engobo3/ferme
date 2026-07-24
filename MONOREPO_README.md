# Monorepo Structure

## Apps
-   `apps/diaspora-web` (Next.js Investor Dashboard)
-   `apps/farm-mobile` (React Native Worker App - "FarmTrust")

## Libs
-   `libs/shared` (Common Logic)

### Shared Modules Plan
1.  **Auth**: `auth-service` (Firebase Auth wrappers)
2.  **Queue**: `offline-sync` (The MediaQueueService logic)
3.  **Types**:Shared TypeScript Interfaces (`Task`, `User`, `Evidence`)

## Next Steps for User
1.  **Close VS Code Editors**: You have files open in `mobile/` and `web/`.
2.  **Delete Old Folders**: Manually delete the `mobile` and `web` folders in the root.
3.  **Re-open**: Open `c:/Users/kense/projects/ferme` and work from the new `apps/` folders.
