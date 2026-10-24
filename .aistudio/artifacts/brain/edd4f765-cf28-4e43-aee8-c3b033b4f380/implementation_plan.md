# Course Attendance & Biometric Face Verification System

A responsive, high-reliability course attendance web application designed for modern educational environments. It provides completely isolated operational paths for Educators and Students, featuring Google Blaze / MediaPipe client-side facial landmark detection with active liveness verification (blink and head turn challenges), time-scoped live attendance sessions, real-time educator feedback, and session challenges.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate the latest user revision and form the approved baseline:

- **Confirmed Decision 1: Fully Isolated Role Paths (`/educator` & `/student`)**: To prevent students from being tempted to access educator features (and vice versa), the application provides two completely independent, partitioned application flows:
  - **Student Flow (`/student`)**: A dedicated kiosk and student portal focusing exclusively on local profile enrollment, biometric face landmark registration, active liveness camera check-in, personal attendance history, educator comments, and challenge submissions. Contains zero educator controls or administrative buttons.
  - **Educator Flow (`/educator`)**: A secure educator dashboard protected with instructor credentials/passcode, providing course creation, roster importing, time-scoped session activation, manual attendance overrides, real-time live attendance monitoring, and challenge publishing.
  - **Gateway Dispatcher (`/`)**: A clean landing gateway that routes users directly to their respective standalone path, with persistent session role locking so students remain in the student environment.
- **Confirmed Decision 2: Persistence Strategy**: Robust browser storage using **IndexedDB** with LocalStorage fallbacks and comprehensive JSON backup export/import tools. This ensures seamless client-side execution, instant offline resilience, zero-latency biometric processing, and zero-config Vercel deployment.
- **Confirmed Decision 3: Biometric Liveness Protocol**: Active multi-stage liveness detection utilizing client-side Google Blaze / MediaPipe face landmarks. The camera stream verifies eye-aspect ratio (EAR) for blinking and yaw angle for head rotation before authorizing attendance, preventing photo and video spoofing.
- **Confirmed Decision 4: Automation & Deployment**: Centralized project **Makefile** providing commands for local development with hot-reloading (`make dev`), test verification (`make test`), production build (`make build`), and Vercel deployment instructions (`make deploy`), alongside `.env.example` structuring and a prepared Prisma schema for optional Supabase PostgreSQL sync.

---

## 1. Overview & Core Concept

### What It Does
The platform automates lecture attendance tracking while eliminating proxy attendance and paper sign-in sheets. Educators and students operate within separate, dedicated URL spaces. Educators create courses, populate rosters via CSV/manual entry, launch timed attendance windows, monitor live attendance logs, provide real-time remarks, and publish preparatory challenges for upcoming sessions. Students enroll their face landmarks once locally, then use their device camera to check into active sessions through an interactive, anti-spoofing liveness sequence.

### Target Audience & Personas
- **Course Instructors & Teaching Assistants**: Work exclusively in `/educator`. Need quick course setup, hassle-free attendance session launches, clear roster visibility, and ability to manually mark or adjust student statuses and leave notes.
- **Students**: Work exclusively in `/student`. Need frictionless, secure check-in during lectures, clear confirmation of attendance status, access to historical attendance records, and immediate view of instructor feedback and challenge tasks.

### Key Value
- **Role Isolation**: No shared navigation or accidental access to educator tools from the student interface.
- **Zero Heavy Backend Requirement**: Runs entirely client-side with lightning-fast biometric inference on the user's GPU/WASM pipeline.
- **Security & Privacy**: Biometric landmark vectors remain encapsulated in the student's browser storage without transmitting raw biometric photos across public networks.
- **Time-Scoped Session Integrity**: Attendance check-ins are restricted to active session countdowns set by the educator.

---

## 2. User Experience & Visual Design

### Isolated Application Routing & Paths

```
                             ┌─────────────────────────────────┐
                             │       Gateway Landing ( / )     │
                             │   Select Workspace / Deep-Link  │
                             └───────────────┬─────────────────┘
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     │                                               │
      ┌──────────────▼──────────────┐                 ┌──────────────▼──────────────┐
      │     EDUCATOR PATH (/educator)│                │     STUDENT PATH (/student)  │
      ├─────────────────────────────┤                 ├─────────────────────────────┤
      │ Secure Passcode / Auth      │                 │ Local Profile Registration  │
      │ 1. Course & Roster Hub      │                 │  - Student ID, Name, Photo  │
      │    - Add/Edit Courses       │                 │  - Face Landmark Enrollment │
      │    - CSV / Manual Roster    │                 │ 2. Live Session Check-In    │
      │ 2. Timed Session Launcher   │                 │  - WebCam Scanner Kiosk     │
      │    - Custom Countdown Timer │                 │  - Blink + Yaw Liveness     │
      │ 3. Live Attendance Feed     │                 │  - Instant Confirmation     │
      │ 4. Attendance Ledger        │                 │ 3. My Attendance History    │
      │    - Manual Status Toggle   │                 │  - Timelines, Educator Notes│
      │    - Educator Remarks       │                 │ 4. Session Challenges       │
      │ 5. Session Challenge Studio │                 │  - View Prompt & Submit     │
      │ 6. Backup & Export Engine   │                 │                             │
      │ (No Student Check-in views) │                 │ (No Educator controls)      │
      └─────────────────────────────┘                 └─────────────────────────────┘
```

### Visual Identity & Theme
- **Aesthetic Direction**: Contemporary, high-clarity SaaS educational console with clean typographic structure, dark slate neutrals, and purposeful semantic accents.
- **Student Environment**: Distraction-free, mobile-optimized kiosk view focused on the camera viewfinder, clear status messages, and personal attendance timeline.
- **Educator Environment**: High-density desktop and tablet console with roster tables, live attendance counter strips, session countdown timer, and student management drawer.
- **Palette & Tokens**:
  - *Dominant Canvas (60%)*: Crisp background `#F8FAFC` (Slate-50) in light mode, `#0B0F19` in deep focus mode.
  - *Structural Surfaces (30%)*: Crisp white card panels `#FFFFFF` with hairline borders `#E2E8F0` (`border border-slate-200`) and subtle shadows.
  - *Accent & Actions (10%)*: Deep indigo/cobalt `#3B82F6` and `#2563EB` for primary action buttons and scanner target reticle; semantic emerald `#10B981` for verified attendance and amber `#F59E0B` for pending/timer countdowns.
- **Typography & Hierarchy**:
  - *Display / Headings*: Plus Jakarta Sans / Outfit with tight tracking (`tracking-tight`) and balanced headlines.
  - *Body Prose*: DM Sans / Inter-standard with 1.6 line height for legibility.
  - *Data & Timers*: Monospace tabular numerals (`font-mono tabular-nums`) for session countdowns, timestamps, and confidence percentages.
- **Zero-Pill Discipline**: Status indicators and timestamps are styled as unboxed text separated with `·` or subtle indicator icons rather than garish capsule pills.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Segregated Routing & Role Isolation**
  - *Chosen Approach*: Distinct client-side routes (`/educator` and `/student`) with an optional Educator Passcode lock. The Student UI has zero links, buttons, or clues to navigate into the Educator dashboard.
  - *Why*: Directly satisfies the user requirement to eliminate temptation or accidental access to educator tools by students.

- **Decision 2: Client-Side Biometrics via Google Blaze / MediaPipe Face Detection & Mesh**
  - *Chosen Approach*: Load Google MediaPipe / Blaze client-side models directly inside the React browser runtime to extract facial keypoints (eyes, nose bridge, jawline contours).
  - *Why*: Eliminates server costs, latency, privacy leaks, and GDPR/FERPA compliance hurdles by processing video frames on-device in under 30ms per frame.

- **Decision 3: Liveness Verification (Active Blink & Yaw Angle Detection)**
  - *Chosen Approach*: Calculate Eye Aspect Ratio (EAR = $\frac{||p_2 - p_6|| + ||p_3 - p_5||}{2 \times ||p_1 - p_4||}$) to detect natural blinks, and measure horizontal ear-to-nose offset for head rotation.
  - *Why*: Guarantees a physical human is present in front of the lens, defeating static printed pictures, phone screen playback, and passive spoofing.

- **Decision 4: BroadcastChannel for Real-Time Cross-Tab Synchronization**
  - *Chosen Approach*: Utilize the HTML5 `BroadcastChannel` API and IndexedDB reactive listeners.
  - *Why*: Allows an educator operating on one tab/device and students checking in on another tab/device to see attendance updates, educator remarks, and active session status in real time.

---

## 4. Technical Architecture & Data Strategy

### Core Data Models

- **Course**: `id`, `name`, `code`, `term`, `createdAt`
- **Student**: `id`, `studentId`, `fullName`, `email`, `courseId`, `faceDescriptor` (normalized landmark vector / biometric hash), `avatarUrl`, `enrolledAt`
- **Session**: `id`, `courseId`, `title`, `date`, `startTime`, `endTime`, `durationMinutes`, `status` (`scheduled` | `active` | `closed`), `passcode`
- **AttendanceRecord**: `id`, `sessionId`, `studentId`, `status` (`present` | `late` | `absent` | `excused`), `timestamp`, `confidenceScore`, `livenessVerified`, `educatorNote`, `markedBy` (`biometric` | `educator`)
- **Challenge**: `id`, `courseId`, `sessionId`, `question`, `dueBeforeDate`, `submissions` (array of `{ studentId, answer, submittedAt, educatorFeedback }`)

### Makefile Structure

```makefile
# Project Management Automation
dev:      # Run local dev server with hot reload
test:     # Run linting and TypeScript validation
build:    # Compile optimized production bundle
deploy:   # Instructions & build check for Vercel deployment
clean:    # Remove build artifacts and temporary cache
```

---

## 5. Verification & Implementation Steps

1. **Phase 1: Project Tooling & Dependencies**
   - Install required packages: `idb` for IndexedDB abstraction, `@mediapipe/face_mesh` / camera utilities, `canvas-confetti`.
   - Setup project `Makefile`, `.env.example`, and `prisma/schema.prisma` for optional Supabase PostgreSQL sync.
2. **Phase 2: Storage & Real-Time Sync Bus**
   - Build typed IndexedDB layer with automated seeding for demo courses, students, and sample sessions.
   - Establish `BroadcastChannel` communication bus for live attendance check-ins and educator session controls.
3. **Phase 3: Blaze Face Landmark & Liveness Pipeline**
   - Build client-side camera capture component with real-time landmark mesh overlay.
   - Implement mathematical Eye Aspect Ratio (EAR) blink analyzer and Head Yaw rotation tracker.
   - Implement Euclidean landmark distance matcher for registered student profiles.
4. **Phase 4: Educator Flow (`/educator`)**
   - Instructor passcode authentication barrier.
   - Course and roster manager with CSV import/export.
   - Time-scoped session launcher with dynamic countdown timer.
   - Real-time attendance ledger with manual overrides, status toggles, and live feedback notes.
   - Challenge manager with student submission review.
5. **Phase 5: Student Flow (`/student`)**
   - Dedicated biometric profile enrollment wizard (local face registration).
   - Live session camera check-in kiosk with interactive blink & turn liveness verification.
   - Attendance history view with instructor comments.
   - Session challenge solver and submission interface.
6. **Phase 6: Gateway & Routing Architecture**
   - Independent path router (`/`, `/educator`, `/student`) with role persistence and zero cross-contamination.
7. **Phase 7: Verification & Build**
   - Test responsive layout on mobile (375px) and desktop (1440px).
   - Execute `compile_applet` and Makefile verification to ensure clean, zero-error production build.
