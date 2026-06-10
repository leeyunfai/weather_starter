# Requirements Document

## Introduction

This feature allows users to assign custom nicknames to their saved weather locations. Currently, locations are displayed using the area name returned by the weather API (e.g., "Bukit Merah", "Clementi"). Users want the ability to give locations memorable, personal names (e.g., "Office", "Mom's Place") that persist across sessions. When a nickname is set, it replaces the API-provided area name in the UI. Users can also edit or clear a nickname to revert to the default API name.

## Glossary

- **Location_Nickname**: A user-defined string label assigned to a saved location, stored persistently in the database alongside the location record
- **API_Area_Name**: The area name returned by the weather provider API (stored in the `weather.area` field), used as the default display name when no nickname is set
- **Display_Name**: The resolved name shown in the UI for a location — the Location_Nickname if one exists, otherwise the API_Area_Name, otherwise the coordinate string
- **Backend**: The Hono + Drizzle ORM server application that manages location persistence and weather data retrieval
- **Frontend**: The React + Vite client application that renders the weather dashboard UI
- **Sidebar_Card**: The UI card component in the sidebar that displays a location's name, weather condition, and temperature
- **Map_Popup**: The popup shown when a map marker is clicked, displaying the location name and basic weather info

## Requirements

### Requirement 1: Store Nickname in Database

**User Story:** As a user, I want my location nickname to be saved permanently, so that it persists across browser sessions and page reloads.

#### Acceptance Criteria

1. THE Backend SHALL store a nullable `nickname` text column (maximum 50 characters) in the locations database table
2. WHEN a location is created, THE Backend SHALL set the nickname field to null by default
3. WHEN a location record is returned from the API, THE Backend SHALL include the `nickname` field in the response payload with a value of null when no nickname has been set

### Requirement 2: Update Nickname via API

**User Story:** As a user, I want to set or change a nickname for a saved location, so that I can personalize how my locations appear.

#### Acceptance Criteria

1. WHEN a PATCH request is received at `/locations/:locationId` with a valid `nickname` string field (1 to 50 characters after trimming leading and trailing whitespace), THE Backend SHALL update the location's nickname to the trimmed value and return the updated location record with HTTP 200
2. WHEN a PATCH request is received with a `nickname` field that is an empty string, THE Backend SHALL set the nickname to null (clearing the nickname) and return the updated location record with HTTP 200
3. WHEN a PATCH request is received with a `nickname` field that exceeds 50 characters after trimming, THE Backend SHALL respond with HTTP 422 and an error message indicating the nickname exceeds the maximum length
4. WHEN a PATCH request targets a location ID that does not exist, THE Backend SHALL respond with HTTP 404 and an error message indicating the location was not found
5. WHEN a PATCH request is received with a `nickname` field containing only whitespace characters, THE Backend SHALL treat the value as empty and set the nickname to null
6. IF a PATCH request is received with a `nickname` field that is not a string type or the request body does not contain a `nickname` field, THEN THE Backend SHALL respond with HTTP 422 and an error message indicating a valid nickname string field is required

### Requirement 3: Display Nickname in Sidebar Card

**User Story:** As a user, I want to see my custom nickname on the sidebar card, so that I can quickly identify my locations by personal labels.

#### Acceptance Criteria

1. WHEN a location has a nickname that is non-null and contains at least one non-whitespace character, THE Sidebar_Card SHALL display the trimmed nickname as the primary location name
2. WHEN a location has a null nickname or a nickname containing only whitespace characters, THE Sidebar_Card SHALL display the API_Area_Name as the primary location name
3. WHEN a location has a null nickname (or whitespace-only nickname) and a null API_Area_Name, THE Sidebar_Card SHALL display the latitude and longitude coordinates formatted as "{latitude}, {longitude}" with each value to exactly three decimal places

### Requirement 4: Display Nickname in Map Popup

**User Story:** As a user, I want to see my custom nickname in the map popup, so that my personal labels appear consistently across all views.

#### Acceptance Criteria

1. WHEN a location has a nickname that is non-null and contains at least one non-whitespace character, THE Map_Popup SHALL display the trimmed nickname as the location name
2. WHEN a location has a null nickname or a nickname containing only whitespace characters, THE Map_Popup SHALL display the API_Area_Name as the location name
3. WHEN a location has a null nickname (or whitespace-only nickname) and a null API_Area_Name, THE Map_Popup SHALL display the latitude and longitude as "{latitude}, {longitude}" with each value formatted to exactly three decimal places

### Requirement 5: Edit Nickname from Sidebar Card

**User Story:** As a user, I want to edit a location's nickname directly from the sidebar, so that I can quickly rename locations without navigating away.

#### Acceptance Criteria

1. THE Sidebar_Card SHALL provide an edit action that activates an inline text input pre-filled with the current nickname, or empty if no nickname is set, with a maximum input length of 50 characters
2. WHEN the user confirms the edit (by pressing Enter or clicking outside the input) with a non-empty trimmed nickname, THE Frontend SHALL send the updated nickname to the Backend and display the nickname as the location's primary name on the Sidebar_Card
3. WHEN the user confirms the edit with an empty or whitespace-only value, THE Frontend SHALL send the update to the Backend to clear the nickname and display the location's area name as the primary name on the Sidebar_Card
4. WHEN the user cancels the edit (by pressing Escape), THE Frontend SHALL discard the changes and revert to the previously displayed name without sending a request to the Backend
5. WHILE the nickname update request is in progress, THE Sidebar_Card SHALL disable the edit input and display a visible loading indicator adjacent to the nickname field
6. IF the nickname update request fails or does not respond within 10 seconds, THEN THE Frontend SHALL display an error indication for at least 3 seconds and revert the displayed name to the previous value

### Requirement 6: Clear Nickname

**User Story:** As a user, I want to remove a nickname from a location, so that it reverts to showing the default API area name.

#### Acceptance Criteria

1. WHEN the user removes all characters from the nickname text input and confirms the edit, THE Frontend SHALL send an empty string as the nickname value to the Backend to clear the nickname
2. WHEN the Backend receives an empty string as the nickname value, THE Backend SHALL store the nickname as null and return the updated location without a nickname in the response
3. WHEN the nickname is cleared successfully, THE Sidebar_Card SHALL display the API_Area_Name returned by the weather provider, or if API_Area_Name is null, display the coordinates formatted as "latitude, longitude" with 3 decimal places
4. IF the clear nickname request fails, THEN THE Frontend SHALL retain the previous nickname in the Sidebar_Card display and show an error message indicating the nickname could not be cleared

### Requirement 7: Nickname in Search Filtering

**User Story:** As a user, I want the sidebar search to match against my custom nicknames, so that I can find locations by their personal labels.

#### Acceptance Criteria

1. WHEN a user types a search query in the sidebar search input, THE Frontend SHALL perform a case-insensitive substring match of the query against both the nickname and the API_Area_Name for each location
2. IF a location has a non-null nickname that matches the search query via case-insensitive substring, THEN THE Frontend SHALL include that location in the filtered results even if the API_Area_Name does not match
3. IF a location has a null nickname, THEN THE Frontend SHALL match the search query against only the API_Area_Name for that location
4. WHEN the search query is empty or contains only whitespace, THE Frontend SHALL display all locations without filtering
