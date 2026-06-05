# Implementation Plan: Location Nicknames

## Overview

Add the ability for users to assign, edit, and clear custom nicknames for saved weather locations. The implementation spans backend (schema migration, PATCH endpoint) and frontend (types, API layer, store, inline editing UX, display name resolution, and search filtering).

## Tasks

- [x] 1. Backend: Schema and database layer
  - [x] 1.1 Add nickname column to schema and create migration
    - Add `nickname: text('nickname')` to the `locations` table in `backend/src/schema.ts`
    - Run `npx drizzle-kit generate` to create the ALTER TABLE migration SQL
    - _Requirements: 1.1_

  - [x] 1.2 Update database layer to support nickname
    - Add `nickname: string | null` to the `LocationRecord` interface in `backend/src/db.ts`
    - Update `rowToRecord` to include `nickname` from the row
    - Add `updateNickname(id: number, nickname: string | null): Promise<LocationRecord | null>` function that updates the nickname column and returns the full record
    - _Requirements: 1.2, 1.3, 2.1_

  - [ ]* 1.3 Write property tests for nickname storage and validation
    - **Property 1: Nickname storage round-trip**
    - **Validates: Requirements 2.1**
    - **Property 2: Overlong nickname rejection**
    - **Validates: Requirements 2.3**
    - **Property 3: Whitespace-only normalization**
    - **Validates: Requirements 2.5**
    - **Property 4: Invalid type rejection**
    - **Validates: Requirements 2.6**

- [x] 2. Backend: PATCH endpoint
  - [x] 2.1 Implement PATCH /locations/:locationId route
    - Add PATCH route in `backend/src/routes/locations.ts`
    - Import `updateNickname` from `../db.js`
    - Validate `nickname` field exists and is a string type (else HTTP 422)
    - Trim the nickname; if trimmed is empty or whitespace-only, store null
    - If trimmed length > 50, respond HTTP 422 with error message
    - If location not found, respond HTTP 404
    - On success, return updated location record with HTTP 200
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.2 Write unit tests for PATCH endpoint
    - Test valid nickname returns 200 and updated record
    - Test empty string clears nickname to null
    - Test whitespace-only clears nickname to null
    - Test overlong nickname returns 422
    - Test non-string type returns 422
    - Test missing nickname field returns 422
    - Test non-existent location returns 404
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Checkpoint - Backend complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 4. Frontend: Types, API, and utility layer
  - [x] 4.1 Update Location interface and add API function
    - Add `nickname: string | null` to the `Location` interface in `frontend/src/types.ts`
    - Add `updateNickname: (id: number, nickname: string) => Promise<void>` to the `StoreValue` interface in `frontend/src/types.ts`
    - Add `updateNickname` function to `frontend/src/api.ts` that sends PATCH to `/locations/${id}` with `{ nickname }` body
    - _Requirements: 1.3, 2.1_

  - [x] 4.2 Implement getDisplayName utility
    - Add `getDisplayName` function to `frontend/src/components/format.ts`
    - Resolution priority: trimmed nickname (if non-empty) → weather.area → coordinates formatted as `"{lat.toFixed(3)}, {lon.toFixed(3)}"`
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [ ]* 4.3 Write property test for getDisplayName
    - **Property 5: Display name resolution priority**
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 4.3**

- [x] 5. Frontend: Store action
  - [x] 5.1 Add updateNickname action to store
    - Add `updateNickname` action in `frontend/src/state/store.tsx`
    - Call `api.updateNickname(id, nickname)`, on success update the location in state with the returned record
    - On failure, throw so the caller can handle error display
    - _Requirements: 5.2, 5.3, 5.6_

- [x] 6. Frontend: SidebarCard inline editing
  - [x] 6.1 Add inline nickname editing to SidebarCard
    - Add edit state: `isEditing`, `editValue`, `isSaving`, `saveError`
    - Replace hard-coded area name with `getDisplayName(location)` for display
    - Activate edit on double-click on the location name
    - Pre-fill input with current nickname (or empty if none)
    - Confirm on Enter or blur: call `store.updateNickname(id, editValue)`
    - Cancel on Escape: discard changes, close input
    - Add `maxLength={50}` on the input element
    - Show loading state (disable input + spinner) while PATCH in flight
    - Show error indicator (red border) for 3 seconds on failure, then revert to previous name
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.3, 6.4_

- [x] 7. Frontend: MapCard and Sidebar updates
  - [x] 7.1 Update MapCard popup to use getDisplayName
    - Replace inline name resolution in `MapCard.tsx` marker `alt` and `Popup` content with `getDisplayName(location)`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Update Sidebar search to include nickname
    - Update the `filtered` useMemo in `frontend/src/components/Sidebar.tsx` to also match against `location.nickname` (case-insensitive substring match)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.3 Write property test for search filter including nicknames
    - **Property 6: Search filter includes nickname matches**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 8. Final checkpoint - Full build verification
  - Run both backend and frontend builds to ensure no type errors or compilation failures
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript for both backend and frontend — all implementation tasks use TypeScript

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["4.3", "6.1", "7.1", "7.2"] },
    { "id": 6, "tasks": ["7.3"] }
  ]
}
```
