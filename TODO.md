# Technical Debt & Code Issues

## Critical Issues

### Missing CRUD Operations
- **No delete functionality for cycles**: Users cannot delete cycles from the store. While `deleteCycle` exists in the store, there's no UI to access it.
- **No delete functionality for days**: Missing delete buttons/functionality in the day management UI.
- **No delete functionality for medications/bloodwork within days**: Users can only add/edit but cannot remove individual medications or bloodwork entries once saved.

### Error Handling & Edge Cases
- **No error handling for localStorage failures**: If localStorage is full or unavailable, the app will crash silently.
- **No validation for cycle date conflicts**: Users can create cycles with end dates before start dates.
- **No handling of malformed stored data**: If localStorage data is corrupted, the app may crash on load.
- **Missing error boundaries**: No React error boundaries to catch and display component crashes gracefully.
- **No network error handling**: While the app is offline-first, there's no handling for future API integration.

### Data Integrity Issues
- **No data migration strategy**: If types change, existing localStorage data may become incompatible.
- **Missing data validation on load**: Stored data is not validated against current schemas when loaded.
- **Potential data loss on browser storage limits**: No warning or graceful handling when approaching storage limits.

## Major Technical Debt

### Code Duplication (DRY Violations)
- **Form schemas duplicated**: Cycle creation (`/cycles/new`) and editing (`/cycles/[id]/edit`) have nearly identical form schemas and validation logic (280+ lines of duplicated code).
- **Calendar/date picker patterns**: Date selection UI and validation is repeated across multiple forms.
- **Status/type display functions**: Functions like `getStatusColor`, `getCycleGoalDisplay`, `getCycleTypeDisplay` are duplicated across `cycle-list.tsx` and `[id]/page.tsx`.
- **Form field patterns**: Repeated FormField components for select dropdowns and date inputs.
- **Medication management logic**: Add/remove/update medication logic is duplicated between day creation and editing pages.

### Component Architecture Issues
- **Overly complex day forms**: The day creation/editing forms are 500+ lines with complex state management that should be broken into smaller components.
- **Missing reusable form components**: No shared components for common form patterns (date picker, medication list, bloodwork list).
- **Inconsistent state management patterns**: Some components use useEffect for data loading while others don't, leading to hydration issues.

### Type Safety & Validation Issues
- **Inconsistent optional field handling**: Some forms allow empty strings while others use undefined, leading to type inconsistencies.
- **Missing runtime type validation**: No validation of data loaded from localStorage against TypeScript types.
- **Loose typing in form handlers**: Many form handlers use `any` type instead of proper typing.

## Moderate Issues

### Performance & UX
- **No loading states**: Forms and data operations provide no visual feedback during processing.
- **Missing optimistic updates**: UI doesn't immediately reflect changes before they're persisted.
- **No data caching strategy**: Same data is re-parsed from localStorage on every component mount.
- **Large bundle size**: Including many unused UI components from shadcn/ui library.

### Accessibility & Usability
- **Missing delete confirmations**: No confirmation dialogs for destructive actions.
- **Inconsistent navigation patterns**: Some pages have back buttons, others don't.
- **No keyboard shortcuts**: No keyboard navigation for power users.
- **Missing form auto-save**: Long forms can lose data if accidentally closed.

### Code Organization
- **Mixed concerns in pages**: Page components handle both UI and business logic.
- **No custom hooks for common patterns**: Repeated data fetching and form management logic.
- **Inconsistent file naming**: Some files use kebab-case, others use camelCase.

## Minor Issues

### Code Quality
- **Magic numbers**: Hard-coded values like array lengths and timeouts without constants.
- **Inconsistent error messages**: Form validation messages aren't standardized.
- **Missing PropTypes or defaultProps**: Some components don't handle missing props gracefully.
- **Unused imports**: Several files import components/functions that aren't used.

### Documentation
- **Missing component documentation**: No JSDoc comments for complex components.
- **No type documentation**: Complex types lack explanatory comments.
- **Missing README sections**: No deployment or development setup instructions.

## Recommended Fixes (Priority Order)

### High Priority
1. **Add delete functionality**: Implement UI for deleting cycles and days with confirmation dialogs.
2. **Add error boundaries**: Wrap main components in error boundaries with user-friendly error messages.
3. **Consolidate form logic**: Create shared form components and schemas to eliminate duplication.
4. **Add data validation**: Validate localStorage data on load and provide migration strategies.

### Medium Priority
1. **Improve error handling**: Add try-catch blocks around localStorage operations and form submissions.
2. **Extract reusable components**: Break down complex forms into smaller, reusable components.
3. **Add loading states**: Provide visual feedback during form submissions and data operations.
4. **Standardize type handling**: Ensure consistent optional field handling across all forms.

### Low Priority
1. **Add accessibility features**: Implement keyboard navigation and screen reader support.
2. **Performance optimization**: Implement data caching and code splitting.
3. **Code cleanup**: Remove unused imports, add documentation, and standardize naming conventions.
4. **Add automated testing**: Implement unit and integration tests for critical functionality.

## Breaking Changes Required
- Updating the store interface to handle errors gracefully
- Modifying type definitions to be more strict about optional fields
- Changing localStorage structure to include version numbers for migration