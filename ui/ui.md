You are a senior product designer + frontend architect + UI engineer.

PROJECT:
AURA — AI Operating System

GOAL:
Upgrade the existing AURA interface from the current dense cyberpunk/HUD dashboard into a polished V2 futuristic AI operating system.

IMPORTANT:
Do NOT rebuild the application from scratch if an existing implementation already exists.
Inspect the existing codebase first and preserve working functionality, APIs, routes, authentication, backend services, AI integrations, Sentinel, Forge, data systems, and existing business logic.

This task is primarily a FRONTEND/UI/UX V2 transformation.

==================================================
1. DESIGN DIRECTION
==================================================

Create a premium futuristic interface inspired by:

- advanced AI operating systems
- spacecraft command interfaces
- JARVIS-style intelligence systems
- modern SaaS dashboards
- holographic interfaces
- high-end developer tools

Avoid making it look like an old hacker terminal.

The interface should feel:

- intelligent
- cinematic
- minimal
- powerful
- highly responsive
- technically advanced
- professional
- production-ready

Do NOT overload every screen with telemetry.

Use strong visual hierarchy.

The user should immediately understand:

1. What AURA is doing
2. What they can ask AURA
3. What AURA is currently working on
4. What systems are online
5. Where to access advanced capabilities

==================================================
2. CRITICAL CONSTRAINT
==================================================

REMOVE ALL HUMAN AVATARS.

Do not use:

- user profile photos
- AI human faces
- assistant portraits
- humanoid assistant images
- character avatars

Use instead:

- AURA logo
- abstract AI glyphs
- geometric neural icons
- holographic symbols
- orbital nodes
- waveform indicators
- system status indicators

The interface must communicate intelligence without representing AURA as a human.

==================================================
3. GLOBAL VISUAL SYSTEM
==================================================

Background:

Use a deep near-black/navy background.

Suggested foundation:

#03070D
#050B12
#07111A

Primary accent:

Cyan / electric teal.

Secondary accents:

- blue
- violet
- subtle magenta
- restrained green for successful states

Do NOT make every element neon.

Neon should be reserved for:

- active controls
- system states
- AURA Core
- important actions
- selected navigation
- progress indicators

Use subtle gradients and atmospheric lighting.

Use:

- glass panels
- backdrop blur
- thin borders
- soft shadows
- subtle inner glow
- radial gradients
- atmospheric particles
- fine grid textures
- holographic lines

Avoid excessive:

- sharp rectangular boxes
- tiny terminal text
- unnecessary borders
- glowing text everywhere
- random decorative elements

==================================================
4. TYPOGRAPHY
==================================================

Use a modern geometric/sans-serif typography system.

Recommended:

Inter
Space Grotesk
Manrope
or equivalent.

Hierarchy:

Display:
32–56px

Page title:
28–40px

Section:
16–20px

Body:
14–16px

Metadata:
11–13px

Never make important information smaller simply to fit more content.

Accessibility and readability are more important than density.

==================================================
5. APPLICATION SHELL
==================================================

Desktop layout:

------------------------------------------------
| AURA | Search | Notifications | Status       |
------------------------------------------------
|      |                                      |
| NAV  |              MAIN                    |
|      |                                      |
|      |                                      |
------------------------------------------------

Left navigation:

AURA logo

HOME
CHAT
WORKSPACE
MISSIONS
INTELLIGENCE
DATA
CREATIVE
AUTOMATION
SECURITY
DEVICES
SETTINGS

Use simple high-quality line icons.

Active navigation:

- cyan edge indicator
- subtle cyan background
- soft glow
- clear typography

Do not use avatars.

Bottom of sidebar:

AURA OS
V2.0
SYSTEM ONLINE

On mobile:

Replace sidebar with a compact navigation system.

Use:

- top navigation
- bottom navigation
- expandable command menu

Never squeeze the desktop sidebar into mobile.

==================================================
6. TOP BAR
==================================================

Create a premium top navigation bar.

Left:

AURA logo
AI OPERATING SYSTEM

Center:

Global command/search field

Placeholder:

"Search, create, analyze anything..."

Keyboard shortcut:

CTRL K

Right:

notification icon
system status
theme/control icon
settings

Do not display a human profile image.

Use an abstract AURA system icon instead.

==================================================
7. HOME DASHBOARD
==================================================

The home dashboard should NOT contain every system metric.

Create a strong hero area.

Hero:

GOOD EVENING.

Main heading:

"All systems are operational."

Supporting text:

"How can I assist you today?"

Centerpiece:

AURA NEURAL CORE

Create a large animated holographic orb / neural sphere.

The orb should be abstract.

NO HUMAN FIGURE.

Use:

- orbital rings
- particles
- neural connections
- flowing data
- rotating geometry
- pulsing light
- subtle scan lines

Inside:

AURA

NEURAL PRIME

Status:

ALL SYSTEMS ONLINE

Around the orb:

UNDERSTAND
LEARN
CREATE
EXPLORE
AUTOMATE
SOLVE
PROTECT

Each capability should be an interactive card.

==================================================
8. AURA CORE ANIMATION
==================================================

Create the centerpiece using CSS/SVG/WebGL where practical.

Animation states:

IDLE
LISTENING
THINKING
GENERATING
EXECUTING
ERROR
OFFLINE

Example:

IDLE:
slow orbital movement

LISTENING:
increased pulse

THINKING:
faster orbital particles

GENERATING:
data streams move outward

EXECUTING:
progress ring

ERROR:
controlled warning state

Do not create distracting constant animation.

Respect:

prefers-reduced-motion

==================================================
9. MAIN CHAT EXPERIENCE
==================================================

The chat must become one of the most important components.

Create:

CHAT WITH AURA

Header:

AURA
NEURAL PRIME ONLINE

Controls:

Model selector
Tools
Expand

Conversation area:

AURA messages
User messages

BUT:

Do NOT use human/user avatars.

Use small geometric identity markers.

AURA message:

AI glyph

User message:

simple user icon or initials only.

Chat should support:

- markdown
- code blocks
- syntax highlighting
- file attachments
- image attachments
- tool execution
- streaming responses
- progress states
- citations
- generated artifacts
- expandable reasoning/status summaries

Never expose private chain-of-thought.

For thinking:

"Analyzing request..."

"Planning..."

"Executing..."

"Completed"

instead of showing hidden reasoning.

==================================================
10. CHAT INPUT
==================================================

Create a large premium command composer.

Placeholder:

"Ask AURA anything..."

Controls:

Attachment
Image
Web
Voice
Send

Quick actions:

Generate an app
Analyze a file
Create an image
Research a topic
More

The input should be:

- sticky
- keyboard friendly
- responsive
- visually dominant

Enter:

Send

Shift + Enter:

New line

==================================================
11. WORKSPACE
==================================================

Create a dedicated Workspace experience.

Workspace should support:

- code
- files
- previews
- terminal
- browser/web results
- generated artifacts
- project structure

Layout:

------------------------------------------------
| Project | Main Workspace | Inspector         |
------------------------------------------------

Tabs:

Code
Preview
Files
Terminal
Logs
AI

Allow AURA to operate as a development copilot.

==================================================
12. MISSIONS
==================================================

Create a dedicated mission/task system.

Mission cards contain:

Task name
Description
Status
Progress
Agent
Time
Actions

Statuses:

QUEUED
RUNNING
PAUSED
COMPLETED
FAILED

Example:

Build AURA OS V2
70%
RUNNING

Integrate new datasets
45%
RUNNING

Optimize model routing
20%
QUEUED

Deploy to production
0%
PENDING

Use animated progress bars.

==================================================
13. INTELLIGENCE
==================================================

Create an Intelligence section.

Include:

Models
Agents
Reasoning
Knowledge
Memory
Capabilities
Model routing

Model cards:

AURA Neural Prime
Multi-model orchestration

Show connected models as compact chips.

Do not invent backend capabilities.

Only display models actually available in the application.

==================================================
14. DATA LIBRARY
==================================================

Create a modern data/knowledge interface.

Categories:

Science & Engineering
Advanced Chemistry
Robotics & AI
Nanomaterials
Space & Physics
Medical & Biotechnology

Only display real datasets/data sources from the application.

Each item:

Name
Description
File count / record count
Last updated
Status
Open

Add:

Search
Filter
Sort
Upload
Import
Export

==================================================
15. CREATIVE
==================================================

Create a Creative workspace.

Capabilities can include:

Image generation
Video generation
3D
Design
Writing
Audio

Use large visual cards.

The interface should feel like a creative studio, not an admin dashboard.

==================================================
16. AUTOMATION
==================================================

Create an automation center.

Show:

Workflows
Agents
Schedules
Triggers
Runs
Logs

Workflow card:

Name
Trigger
Last run
Next run
Status

Actions:

Run
Pause
Edit
Duplicate

==================================================
17. SECURITY / SENTINEL
==================================================

Create a dedicated Security dashboard.

Use the existing Sentinel functionality.

Show:

System security
Network
Threat status
Permissions
Events
Audit log

States:

SECURE
WARNING
THREAT DETECTED
OFFLINE

Security UI should be professional and restrained.

Do not make fake cybersecurity claims.

Only show real backend data.

==================================================
18. SYSTEM MONITOR
==================================================

System information should be secondary.

Use compact cards:

CPU
RAM
GPU
Storage
Network

Example:

CPU 28%
RAM 46%
GPU 12%
Storage 38%

Use circular or horizontal indicators.

Do not dominate the dashboard with metrics.

==================================================
19. QUICK TOOLS
==================================================

Create a Quick Tools component.

Actions:

Generate
Code
Analyze
Research
Plan
Create App

Use icon + label.

Make them large enough for touch.

==================================================
20. ACTIVITY STREAM
==================================================

Create:

ACTIVITY STREAM

Examples:

System initialized
Local data synced
Model switched
Security scan completed
New insight available
Agent task completed

Each event:

icon
event
time
status

Allow filtering.

==================================================
21. FOCUS TIMER
==================================================

Create a compact Focus Timer.

25:00

START

RESET

Allow configurable durations.

Do not let this dominate the dashboard.

==================================================
22. HOME PAGE INFORMATION ARCHITECTURE
==================================================

Recommended order:

1. Top navigation
2. Hero / AURA Core
3. Chat
4. Quick actions
5. System summary
6. Missions
7. Knowledge & Data
8. Activity Stream

Avoid the original dashboard problem where 15+ panels compete for attention.

==================================================
23. RESPONSIVE DESIGN
==================================================

This is extremely important.

Desktop:

1440px+
Three-column capable layout.

Tablet:

768–1439px
Two-column layout.

Mobile:

320–767px
Single-column layout.

Mobile must NOT be a scaled-down desktop.

For mobile:

- hide desktop sidebar
- use bottom navigation
- stack cards
- enlarge touch targets
- simplify telemetry
- keep AURA Core prominent
- chat composer fixed near bottom
- avoid horizontal overflow
- avoid tiny text
- maintain readable spacing

Minimum touch target:

44px.

==================================================
24. DESIGN TOKENS
==================================================

Create centralized design tokens.

Example:

--background
--surface
--surface-elevated
--border
--text-primary
--text-secondary
--accent
--accent-soft
--success
--warning
--danger

Spacing:

4
8
12
16
24
32
48
64

Border radius:

10
14
18
24

Use consistent tokens everywhere.

==================================================
25. COMPONENT ARCHITECTURE
==================================================

Build reusable components.

Suggested:

AuraShell
AuraSidebar
AuraTopbar
CommandSearch
AuraCore
CoreCapability
SystemStatus
ChatPanel
ChatMessage
CommandComposer
QuickTools
MissionCard
MissionQueue
ModelCard
KnowledgeCard
ActivityStream
FocusTimer
SecurityPanel
NetworkMonitor
DataLibrary
WorkflowCard
StatusBadge
GlassPanel
MetricCard
EmptyState
LoadingState
ErrorState

Avoid massive monolithic components.

==================================================
26. STATE SYSTEM
==================================================

Create reusable state indicators.

ONLINE
OFFLINE
ACTIVE
IDLE
THINKING
RUNNING
PAUSED
COMPLETED
WARNING
ERROR

Each state should have:

icon
label
visual indicator

Do not rely only on color.

==================================================
27. MICROINTERACTIONS
==================================================

Add subtle animations:

- hover elevation
- button glow
- panel entrance
- progress animation
- status pulse
- orb movement
- command composer focus
- navigation transition
- modal transitions

Use Framer Motion if already installed or if appropriate.

Do not add unnecessary dependencies.

==================================================
28. ACCESSIBILITY
==================================================

Support:

keyboard navigation
focus states
ARIA labels
screen readers
reduced motion
sufficient contrast
large touch targets

Do not use color as the only indicator.

==================================================
29. PERFORMANCE
==================================================

Do NOT create a UI that looks impressive but destroys performance.

Optimize:

- canvas/WebGL effects
- particle counts
- image loading
- animations
- rerenders
- large lists

Use:

lazy loading
memoization where useful
virtualization for large datasets
optimized images

The dashboard should remain responsive on mid-range mobile devices.

==================================================
30. NO FAKE DATA
==================================================

This is critical.

Do not fabricate:

CPU usage
GPU usage
network speeds
dataset counts
AI models
security events
mission progress
agent status

If backend data exists:

connect the UI to it.

If a feature is not implemented:

show an appropriate empty state or disabled state.

Example:

"Not connected"

instead of inventing data.

==================================================
31. EXISTING FUNCTIONALITY
==================================================

Before modifying code:

1. Inspect repository structure.
2. Identify frontend framework.
3. Identify routing.
4. Identify component system.
5. Identify existing API calls.
6. Identify existing state management.
7. Identify authentication.
8. Identify AURA AI integration.
9. Identify Forge integration.
10. Identify Sentinel integration.
11. Identify existing database/data layer.

Preserve all functional integrations.

Do not break backend functionality while redesigning the frontend.

==================================================
32. IMPLEMENTATION STRATEGY
==================================================

Phase 1:
Audit existing application.

Phase 2:
Create design system/tokens.

Phase 3:
Create application shell.

Phase 4:
Implement responsive navigation.

Phase 5:
Implement AURA Core.

Phase 6:
Implement Chat.

Phase 7:
Implement Workspace.

Phase 8:
Implement Missions.

Phase 9:
Implement Intelligence/Data.

Phase 10:
Implement Automation.

Phase 11:
Implement Security/Sentinel.

Phase 12:
Connect existing data.

Phase 13:
Responsive optimization.

Phase 14:
Accessibility.

Phase 15:
Performance optimization.

Phase 16:
Final QA.

==================================================
33. ROUTES
==================================================

Use the existing routing system where possible.

Recommended information architecture:

/
  Home

/chat
  Chat

/workspace
  Workspace

/missions
  Missions

/intelligence
  Intelligence

/data
  Data Library

/creative
  Creative

/automation
  Automation

/security
  Security

/devices
  Devices

/settings
  Settings

Do not create duplicate routes if equivalent routes already exist.

==================================================
34. EMPTY STATES
==================================================

Every data-driven section needs a useful empty state.

Examples:

"No active missions."

"No connected datasets."

"No recent activity."

"No workflows configured."

"Sentinel is not connected."

Provide an appropriate action:

Connect
Create
Import
Configure
Refresh

==================================================
35. ERROR STATES
==================================================

Errors must be understandable.

Example:

"Unable to connect to AURA Core."

Actions:

Retry
View Logs
Settings

Do not show raw stack traces to normal users.

==================================================
36. LOADING STATES
==================================================

Use skeleton loaders rather than blank screens.

For AURA:

AURA CORE INITIALIZING...

For chat:

AURA IS THINKING...

For missions:

LOADING MISSIONS...

==================================================
37. VISUAL HIERARCHY
==================================================

Priority order:

PRIMARY:
AURA Core
Chat
Current task

SECONDARY:
Quick Tools
Missions
Active Model

TERTIARY:
System metrics
Network
Activity

Do not give tertiary information the same visual prominence as the AI interaction.

==================================================
38. FINAL VISUAL QUALITY
==================================================

The finished product should look like a real commercial AI operating system.

It should NOT look like:

- a generic admin template
- a Bootstrap dashboard
- a hacker terminal
- an overdecorated cyberpunk website
- a collection of random cards
- an AI-generated concept that cannot actually function

The design must be coherent and implementable.

==================================================
39. FINAL QA CHECKLIST
==================================================

Before finishing, verify:

[ ] No human avatars anywhere
[ ] No profile photographs
[ ] No AI humanoid portraits
[ ] Responsive on mobile
[ ] No horizontal overflow
[ ] Desktop layout works
[ ] Tablet layout works
[ ] Chat works
[ ] Existing APIs still work
[ ] Existing authentication still works
[ ] Existing Sentinel integration preserved
[ ] Existing Forge integration preserved
[ ] Existing AI functionality preserved
[ ] No fake system statistics
[ ] No fake datasets
[ ] No fake model availability
[ ] Keyboard navigation works
[ ] Reduced-motion mode works
[ ] Loading states exist
[ ] Error states exist
[ ] Empty states exist
[ ] Buttons have proper hover/focus states
[ ] Touch targets are sufficiently large
[ ] Animations are performant
[ ] No console errors
[ ] No broken routes
[ ] No unused major components
[ ] No unnecessary dependencies

==================================================
40. DELIVERABLE
==================================================

Implement AURA V2 directly into the existing application.

Do not merely create a mockup.

The final result must be a functional production-quality UI.

After implementation provide:

1. Files changed
2. Components created
3. Routes changed
4. Existing integrations preserved
5. New dependencies added, if any
6. Any environment variables required
7. Commands to run the application
8. Known limitations
9. Screenshots/preview of the completed UI

MOST IMPORTANT DESIGN RULE:

AURA should feel like an intelligent operating system, not a dashboard full of widgets.

Less clutter.
More hierarchy.
More space.
Better typography.
Better interaction.
Stronger AURA Core.
Better chat experience.
No avatars.
No fake telemetry.
Production quality.