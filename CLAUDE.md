# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an IVF (In Vitro Fertilization) tracking application built with Next.js that allows users to track their IVF cycles, daily medications, clinic visits, follicle measurements, bloodwork results, and cycle outcomes. The app provides comprehensive data visualization through charts and analytics.

## Development Commands

Claude should not run any development commands. Someone else will do the testing.

## Architecture

### State Management
The application uses Zustand with persistence for state management. The main store is in `lib/store.ts` and manages:
- IVF cycles with full CRUD operations
- Cycle days with medications, clinic visits, follicle measurements, and bloodwork
- Cycle outcomes with detailed metrics

### Data Model
Key types are defined in `lib/types.ts`:
- `IVFCycle` - Main cycle entity with days and outcome
- `CycleDay` - Individual day with medications, visits, measurements, bloodwork
- `CycleOutcome` - Detailed outcome metrics (eggs retrieved, fertilized, embryos, etc.)
- `FollicleMeasurement`, `BloodworkResult`, `Medication`, `ClinicVisit` - Supporting types

### UI Framework
- Next.js 15 with App Router
- Tailwind CSS for styling
- Radix UI components via shadcn/ui
- Recharts for data visualization
- Lucide React for icons

### Route Structure
- `/` - Home page with cycle list
- `/cycles/new` - Create new cycle
- `/cycles/[id]` - View cycle details with charts
- `/cycles/[id]/edit` - Edit cycle
- `/cycles/[id]/days/new` - Add new day
- `/cycles/[id]/days/[dayId]` - View day details
- `/cycles/[id]/days/[dayId]/edit` - Edit day

### Key Components
- `CycleList` - Display all cycles with status and outcomes
- `CycleChartsView` - Comprehensive data visualization including:
  - Outcome funnel charts (eggs → embryos → blastocysts)
  - Follicle growth tracking (count, size trends, individual measurements)
  - Hormone level trends (estradiol, LH, FSH, progesterone, hCG)
  - Endometrial lining thickness
  - PGT testing results
  - Success rate analysis
- `DayCard` - Display individual day information
- `CycleOutcomeCard` - Display cycle outcome summary

### Data Persistence
All data is persisted to localStorage via Zustand's persist middleware using the key "ivf-tracker-storage".

## Key Features

1. **Cycle Management** - Track multiple IVF cycles with different protocols
2. **Daily Tracking** - Record medications, appointments, measurements, and notes
3. **Data Visualization** - Comprehensive charts for follicle growth, hormone levels, and outcomes
4. **Outcome Analysis** - Detailed metrics and success rate calculations
5. **Responsive Design** - Mobile-friendly interface

## Development Notes

- The app uses TypeScript with strict mode
- Components follow the shadcn/ui pattern with separate UI components
- Charts are built with Recharts and include detailed tooltips and responsive layouts
- Date handling uses date-fns for parsing and formatting
- Form validation uses react-hook-form with Zod resolvers
- No external backend - all data is stored client-side
