# Untitled

# 🥜 CASHEWNUT

## Product Requirements Document (PRD)

**Version:** 1.0 | **Status:** Approved for Development | **Date:** February 2026

**Author:** Product Team | **Confidentiality:** Internal Use Only

---

## 📋 Document Control

| Field | Details |
| --- | --- |
| **Product Name** | CASHEWNUT |
| **Tagline** | "One Prompt. Any Platform. Infinite Possibilities." |
| **Product Type** | AI-Powered Universal Development Platform |
| **Target Launch** | Q4 2026 (MVP), Q2 2027 (GA) |
| **Stakeholders** | Engineering, Design, AI Research, DevRel, GTM, Legal, Security |
| **PRD Owner** | Head of Product |
| **Review Cycle** | Bi-weekly Sprint Reviews |

---

## 🎯 1. Executive Summary

### 1.1 Product Vision

> **CASHEWNUT** empowers developers, teams, and creators to build production-ready applications across **any framework, any platform, any stack** — from a single natural language prompt. By unifying AI code generation, live preview infrastructure, real-time collaboration, and one-click deployment, we eliminate the friction between idea and shipped product.
> 

### 1.2 Mission Statement

 Democratize full-stack development by making every framework accessible through conversational AI, while preserving developer control, code quality, and team collaboration.
> 

### 1.3 North Star Metric

> **% of user prompts that result in a deployed, functional application within 10 minutes**
> 

### 1.4 Key Differentiators

| Feature | CASHEWNUT | Competitors (v0, Bolt, Cursor) |
| --- | --- | --- |
| **Platform Coverage** | ✅ Web, Mobile (RN/Flutter/Native), Desktop (Electron/Tauri), Backend (Node/Python/Go) | ❌ Web-focused only |
| **Live Preview** | ✅ In-browser WebContainers + Expo/Flutter Web + Desktop proxy | ⚠️ Web-only or external emulators |
| **Real-Time Collaboration** | ✅ CRDT-based multi-user editing + shared AI context (atoms.dev style) | ❌ Single-user or basic sharing |
| **Framework Agnosticism** | ✅ Plugin architecture for any framework via MCP tools | ❌ Hardcoded framework support |
| **AI Agent Orchestration** | ✅ Multi-agent "Coworkers" system for planning, coding, testing | ⚠️ Single-model responses |
| **Self-Hosting** | ✅ Enterprise option with local LLM support | ❌ SaaS-only |

---

## 👥 2. Target Users & Personas

### 2.1 Primary Personas

### 🧑‍💻 Persona A: "Full-Stack Freelancer Fiona"

```yaml
Demographics:
  - Role: Independent developer/consultant
  - Experience: 3-7 years
  - Tech Stack: React, Node, Python, occasional mobile

Pain Points:
  - "I waste hours scaffolding new projects for different clients"
  - "Switching between React Native and web contexts slows me down"
  - "Clients want to see progress instantly, but setting up previews takes time"

Goals with CASHEWNUT:
  - Generate client-specific apps in minutes, not days
  - Show live previews during discovery calls
  - Maintain one workflow for all project types

Success Criteria:
  - 80% reduction in project setup time
  - Ability to demo functional prototypes in first client meeting
```

### 👨‍👩‍👧‍👦 Persona B: "Startup Squad Sam"

```yaml
Demographics:
  - Role: CTO/Founding Engineer at early-stage startup
  - Team Size: 2-10 engineers
  - Stage: Pre-seed to Series A

Pain Points:
  - "We need to validate ideas fast across web + mobile"
  - "Onboarding new devs to our stack takes weeks"
  - "AI tools help but don't understand our full architecture"

Goals with CASHEWNUT:
  - Rapidly prototype MVPs across platforms simultaneously
  - Onboard teammates via shared AI context and collaborative editing
  - Generate production-ready code that integrates with our backend

Success Criteria:
  - Ship MVP 3x faster than traditional development
  - Reduce onboarding time from 2 weeks → 2 days
  - Maintain code quality standards with AI-assisted reviews
```

### 🏢 Persona C: "Enterprise Engineer Elena"

```yaml
Demographics:
  - Role: Senior Engineer at Fortune 500 company
  - Environment: Regulated industry (finance, healthcare)
  - Constraints: Security, compliance, legacy integration

Pain Points:
  - "AI tools can't access our internal APIs or design systems"
  - "We need audit trails and approval workflows for generated code"
  - "Can't use cloud-based AI for sensitive projects"

Goals with CASHEWNUT:
  - Extend AI generation to internal frameworks via plugins
  - Enforce compliance rules in generated code
  - Deploy self-hosted instance with local LLMs for sensitive work

Success Criteria:
  - 100% of generated code passes security scanning
  - Seamless integration with internal CI/CD and design systems
  - Full audit log of AI interactions and code changes
```

### 2.2 Secondary Personas

- 👨‍🎓 **Student/Self-Taught Dev**: Learn by building; needs guided prompts and educational scaffolding
- 🎨 **Designer/No-Code Creator**: Visual thinker; needs Figma-to-code and natural language interface
- 🤖 **AI Researcher**: Wants to experiment with model fine-tuning and custom agent behaviors

---

## ❗ 3. Problem Statement

### 3.1 Market Gap Analysis

```
Current AI coding tools suffer from the "Framework Fragmentation Problem":

┌─────────────────┬─────────────────┬─────────────────┐
│ Tool            │ Strengths       │ Critical Gaps   │
├─────────────────┼─────────────────┼─────────────────┤
│ v0.dev          │ Beautiful React │ Web-only; no    │
│                 │ UI generation   │ mobile/desktop  │
├─────────────────┼─────────────────┼─────────────────┤
│ Bolt.new        │ Full-stack web  │ Limited to      │
│                 │ previews        │ Node/React      │
├─────────────────┼─────────────────┼─────────────────┤
│ Cursor          │ IDE integration │ No live preview;│
│                 │                 │ single-user     │
├─────────────────┼─────────────────┼─────────────────┤
│ Expo Snack      │ RN live preview │ Manual coding;  │
│                 │                 │ no AI generation│
└─────────────────┴─────────────────┴─────────────────┘

Result: Developers juggle 4-5 tools to build one cross-platform product.
```

### 3.2 User Pain Points (Validated via 50+ Interviews)

1. **Context Switching Overhead**: "I lose 30% of my day just setting up environments for different platforms"
2. **Preview Friction**: "Getting a React Native app running on my phone takes 15 minutes of config"
3. **Collaboration Silos**: "My designer uses Figma, I use VS Code, my PM uses Notion — nothing syncs"
4. **AI Limitations**: "Claude can write React, but doesn't know my company's Flutter standards"
5. **Deployment Complexity**: "Generating code is easy; getting it to production is still hard"

### 3.3 Opportunity Size

- **TAM**: $45B global low-code/no-code + AI developer tools market (Gartner 2025)
- **SAM**: $12B addressable via cross-platform AI generation (web + mobile + desktop)
- **SOM**: $1.2B achievable in 5 years with 10% SAM penetration

---

## 💡 4. Solution Overview

### 4.1 Product Concept

```
CASHEWNUT = (Claude Code SDK + Custom MCP Tools) × (Multi-Platform Generators) × (Live Preview Infrastructure) × (CRDT Collaboration)

User Flow:
1. User describes app in natural language
2. AI Router selects target frameworks + architecture
3. Multi-Agent System plans, generates, and validates code
4. Live Preview spins up in-browser or via proxy
5. Teammates join via "Coworkers" for real-time editing
6. One-click deploy to target platform(s)
7. Iterate via chat: "Add dark mode", "Fix the login bug", etc.
```

### 4.2 Core Value Propositions

| For Whom | Value Prop | Proof Point |
| --- | --- | --- |
| **Individual Devs** | "Build any app, any platform, from one prompt" | Generate React Native + FastAPI backend in <5 mins |
| **Teams** | "Collaborate with AI and humans in real-time" | 3 teammates + 2 AI agents editing same codebase simultaneously |
| **Enterprises** | "Extend AI to your stack with plugins + self-host" | Custom MCP tool generates code using internal design system |
| **Educators** | "Teach full-stack concepts through guided generation" | Step-by-step mode explains each generated component |

### 4.3 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Web App     │ │ Desktop App │ │ Mobile App  │            │
│  │ (Next.js)   │ │ (Tauri)     │ │ (React Nat)│            │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │
│         │               │               │                   │
│  ┌──────▼───────────────▼───────────────▼──────┐            │
│  │           UNIFIED EDITOR UI                  │            │
│  │  • Monaco + CodeMirror 6 + CRDT sync         │            │
│  │  • Multi-pane: Chat | Code | Preview | Term  │            │
│  │  • "Coworkers" presence + AI agent avatars   │            │
│  └─────────────────┬───────────────────────────┘            │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                 ORCHESTRATION LAYER                          │
│  ┌─────────────────────────────────────────┐                │
│  │ AI Agent Router (TypeScript)            │                │
│  │ • Intent parsing + framework detection  │                │
│  │ • Multi-model fallback (Claude + local) │                │
│  │ • Tool selection via MCP registry       │                │
│  └────────────────┬────────────────────────┘                │
│                   │                                          │
│  ┌────────────────▼─────────────────┐                       │
│  │ MCP Server Registry (Plugin Hub) │                       │
│  │ • generate_react_native          │                       │
│  │ • generate_flutter               │                       │
│  │ • generate_electron              │                       │
│  │ • generate_tauri                 │                       │
│  │ • generate_fastapi               │                       │
│  │ • live_preview_setup             │                       │
│  │ • deploy_vercel                  │                       │
│  │ • deploy_eas                     │                       │
│  │ • [community plugins...]         │                       │
│  └────────────────┬─────────────────┘                       │
└───────────────────┼─────────────────────────────────────────┘
                    │ gRPC / Internal API
┌───────────────────▼─────────────────────────────────────────┐
│              EXECUTION & PREVIEW LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ WebContainers│ │ Expo Snack  │ │ Flutter Web │           │
│  │ (in-browser)│ │ API Proxy   │ │ Embed       │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │                   │
│  ┌──────▼───────────────▼───────────────▼──────┐           │
│  │           SANDBOX MANAGER                    │           │
│  │  • Docker/Firecracker for server-side code  │           │
│  │  • Resource limits + security policies      │           │
│  │  • Auto-shutdown after inactivity           │           │
│  └─────────────────┬───────────────────────────┘           │
└────────────────────┼────────────────────────────────────────┘
                     │ Deployment APIs
┌────────────────────▼────────────────────────────────────────┐
│                 DEPLOYMENT LAYER                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Vercel      │ │ EAS Build   │ │ GitHub      │            │
│  │ Platform API│ │ (Expo)      │ │ Actions     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ AWS        │ │ GCP         │ │ Azure       │            │
│  │ MCP Tool   │ │ MCP Tool    │ │ MCP Tool    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 5. Functional Requirements

### 5.1 Core Feature Set (MVP)

### FR-001: Universal Prompt Interface

```gherkin
Feature: Natural Language to Multi-Platform Code
  As a user
  I want to describe my app in plain English
  So that CASHEWNUT generates code for my target platform(s)

  Scenario: Generate React Native app with backend
    Given I type: "Build a task manager app with React Native and Supabase auth"
    When I select target platforms: [React Native, Web, Supabase]
    Then CASHEWNUT generates:
      | Artifact | Description |
      |----------|-------------|
      | Expo project | src/ with screens, navigation, components |
      | Supabase schema | tables: users, tasks, with RLS policies |
      | Auth flow | OAuth + email/password with Supabase Auth |
      | API hooks | React Query hooks for CRUD operations |
    And I see live preview in Expo Snack embed
    And I can invite teammates to collaborate

  Scenario: Generate Electron + Tauri desktop app
    Given I type: "Create a markdown editor with local file sync"
    When I select: [Electron, Tauri]
    Then CASHEWNUT generates:
      | Artifact | Description |
      |----------|-------------|
      | Electron main.js | Window management, IPC handlers |
      | Tauri src-tauri/ | Rust backend with file system APIs |
      | Shared frontend | React + Tailwind components |
      | Build configs | package.json, tauri.conf.json, electron-builder.yml |
    And I see side-by-side previews of both desktop builds
```

### FR-002: Live Preview Infrastructure

```gherkin
Feature: Instant Visual Feedback for Any Platform
  As a user
  I want to see my app running immediately after generation
  So that I can validate functionality without local setup

  Scenario: Web app preview via WebContainers
    Given a generated Next.js app
    When generation completes
    Then CASHEWNUT spins up WebContainers in-browser
    And I see interactive preview in iframe
    And console/logs are visible in terminal pane
    And hot-reload works on code edits

  Scenario: React Native preview via Expo
    Given a generated Expo project
    When generation completes
    Then CASHEWNUT provisions Expo Snack session
    And I see mobile preview in responsive iframe
    And I can scan QR code to run on physical device
    And console logs stream to web interface

  Scenario: Desktop app preview via proxy
    Given a generated Electron/Tauri app
    When generation completes
    Then CASHEWNUT starts dev server in isolated container
    And proxies UI to iframe via secure tunnel
    And I can interact with desktop-like UI in browser
    And native API calls are mocked/sandboxed
```

### FR-003: Real-Time Collaboration ("Coworkers")

```gherkin
Feature: Multi-User + Multi-Agent Collaborative Editing
  As a team member
  I want to edit code and chat with AI alongside my teammates
  So that we can build faster together

  Scenario: Invite teammate to session
    Given I'm in an active CASHEWNUT project
    When I click "Invite Coworker" and share link
    And my teammate joins via browser
    Then we both see:
      | Element | Behavior |
      |---------|----------|
      | Live cursors | See each other's cursor positions + selections |
      | CRDT sync | Edits merge conflict-free in real-time |
      | Shared chat | AI responses visible to all participants |
      | Presence indicators | Avatars show who's viewing which file |

  Scenario: AI Agent "Coworkers" collaboration
    Given a complex prompt: "Build an e-commerce app with payments"
    When CASHEWNUT activates multi-agent mode
    Then specialized agents collaborate:
      | Agent | Responsibility |
      |-------|---------------|
      | 🎯 Product Agent | Clarifies requirements, user stories |
      | 🏗️ Architect Agent | Selects stack, designs data flow |
      | 💻 Code Agent | Generates framework-specific code |
      | 🧪 QA Agent | Writes tests, validates edge cases |
    And agents debate via internal chat before finalizing code
    And users can intervene: "Actually, use Stripe not PayPal"
```

### FR-004: Framework Plugin System (MCP-Based)

```gherkin
Feature: Extend CASHEWNUT to Any Framework via Plugins
  As an enterprise user
  I want to add support for our internal framework
  So that AI generates code compliant with our standards

  Scenario: Install community plugin
    Given I'm on the CASHEWNUT plugin marketplace
    When I search "Flutter" and install official plugin
    Then CASHEWNUT registers new MCP tools:
      - generate_flutter_app
      - generate_flutter_widget
      - flutter_preview_setup
    And I can now select Flutter as target platform
    And generated code follows Flutter best practices

  Scenario: Create custom enterprise plugin
    Given I have an internal design system "AcmeUI"
    When I use MCP SDK to create acme-ui-generator plugin
    And define tools:
      - generate_acme_component(props: DesignToken)
      - validate_acme_compliance(code: string)
    And deploy plugin to private registry
    Then my team can select "AcmeUI" as target framework
    And all generated components use our design tokens
    And compliance validation runs pre-commit
```

### FR-005: One-Click Multi-Platform Deployment

```gherkin
Feature: Deploy Generated Apps to Production
  As a user
  I want to ship my app with one click
  So that I don't waste time on DevOps config

  Scenario: Deploy web app to Vercel
    Given a generated Next.js project
    When I click "Deploy to Vercel"
    Then CASHEWNUT:
      - Creates new Vercel project via Platform API
      - Pushes code to connected GitHub repo
      - Configures build settings + env vars
      - Triggers deployment
    And I see live URL + deployment logs in CASHEWNUT
    And subsequent edits auto-deploy to preview branches

  Scenario: Deploy mobile app via EAS
    Given a generated Expo project
    When I click "Build for iOS/Android"
    Then CASHEWNUT:
      - Submits build job to EAS Build API
      - Shows real-time build progress
      - Notifies when TestFlight/Play Store build ready
    And I can download IPA/APK or submit to stores directly

  Scenario: Deploy desktop app via GitHub Actions
    Given a generated Electron/Tauri project
    When I click "Create Release Build"
    Then CASHEWNUT:
      - Commits code to GitHub repo
      - Triggers pre-configured Actions workflow
      - Builds binaries for Windows/macOS/Linux
      - Uploads artifacts to GitHub Releases
    And I get download links + auto-update config
```

### 5.2 Non-Functional Requirements

| Category | Requirement | Acceptance Criteria |
| --- | --- | --- |
| **Performance** | Prompt-to-preview latency | <30s for web apps, <90s for mobile/desktop |
| **Performance** | Collaborative edit sync | <100ms CRDT propagation between users |
| **Scalability** | Concurrent preview sessions | Support 10K simultaneous WebContainers |
| **Reliability** | Uptime SLA | 99.9% for core generation + preview services |
| **Security** | Code sandboxing | Zero escape from WebContainers/Docker sandboxes |
| **Security** | Data isolation | Tenant data encrypted at rest + in transit |
| **Compliance** | Audit logging | All AI interactions + code changes logged for enterprise |
| **Accessibility** | WCAG 2.1 AA | Editor UI passes automated + manual a11y tests |
| **Internationalization** | i18n support | UI + AI prompts support 10+ languages at launch |
| **Extensibility** | Plugin load time | New MCP tools register in <5s without restart |

---

## 🎨 6. User Experience Specifications

### 6.1 Core User Journey Map

```
[Discovery] → [Prompt] → [Generation] → [Preview] → [Collaborate] → [Deploy] → [Iterate]

Touchpoints:
1. Landing Page
   - Interactive demo: "Type any app idea → see it built"
   - Framework selector grid (Web, Mobile, Desktop icons)
   - "Start Building" CTA → auth or guest mode

2. Project Workspace (Primary UI)
   ┌─────────────────────────────────────┐
   │ [Chat Panel]  [Code Editor]  [Preview] │
   │                                     │
   │ • AI chat with context-aware replies│
   │ • Monaco editor with CRDT cursors   │
   │ • Live preview iframe + device toggle│
   │ • Terminal pane for logs/commands   │
   │ • "Coworkers" sidebar: humans + AI  │
   └─────────────────────────────────────┘

3. Collaboration Flow
   - Invite via link/email → real-time presence
   - @mention teammates or AI agents in chat
   - Resolve comments inline on code lines
   - Version history with AI-change annotations

4. Deployment Modal
   - Platform selector (Vercel, EAS, GitHub, etc.)
   - Environment config (dev/staging/prod)
   - One-click auth + permission grant
   - Progress tracker + post-deploy actions

5. Iteration Loop
   - "Make changes" chat: "Add dark mode", "Fix login bug"
   - AI proposes diffs → user approves/rejects
   - Preview updates instantly on approval
   - Auto-commit to git with AI-generated messages
```

### 6.2 Key UI Components (Wireframe Descriptions)

### Component: Multi-Pane Editor Layout

```
┌──────────────────────────────────────────────┐
│ HEADER: Project name | Framework badges | [Deploy] [Share] │
├──────────────┬─────────────────┬─────────────┤
│              │                 │             │
│  CHAT PANEL  │   CODE EDITOR   │   PREVIEW   │
│  (30% width) │   (40% width)   │  (30% width)│
│              │                 │             │
│  • AI convo  │  • Monaco with  │  • iframe   │
│  • Context   │    syntax highlight│  • Device │
│    chips     │  • CRDT cursors │    toggle   │
│  • @mentions │  • Inline      │  • Console  │
│              │    comments    │    logs     │
├──────────────┴─────────────────┴─────────────┤
│ FOOTER: Terminal pane (collapsible) + Status bar │
└──────────────────────────────────────────────┘
```

### Component: "Coworkers" Presence Sidebar

```
[Coworkers] ▼
├─ 👤 You (host)
├─ 👤 Jane D. (editing src/App.tsx)
├─ 🤖 Architect Agent (planning data flow)
├─ 🤖 QA Agent (writing tests)
└─ [Invite more...]

Click avatar to:
- See their cursor in editor
- Start voice/video call (WebRTC)
- Assign task: "Jane, review this component"
- Ping AI agent: "@QA, is this test coverage enough?"
```

### Component: Framework Selector (Prompt Time)

```
"What do you want to build?" [text input]

"Target platforms:" (multi-select chips)
[✅ Web] [✅ React Native] [✅ Flutter] [✅ Electron] [✅ Tauri] [✅ Python Backend]

"Advanced options:" ▼
• Include authentication? [ ] Yes → [Supabase] [Auth0] [Custom]
• Include database? [ ] Yes → [PostgreSQL] [MongoDB] [Firebase]
• Design system? [ ] Tailwind [ ] Material [ ] AcmeUI (plugin)

[Generate] button → shows estimated time + resource usage
```

---

## 🏗️ 7. Technical Architecture Deep Dive

### 7.1 AI Orchestration Layer

### Agent Router Logic (Pseudocode)

```tsx
interface AgentRouter {
  async routePrompt(prompt: string, context: UserContext): Promise<ExecutionPlan> {
    // Step 1: Intent Classification
    const intent = await classifyIntent(prompt, {
      model: "claude-sonnet-4",
      tools: ["framework_detector", "complexity_estimator"]
    });

    // Step 2: Framework Selection
    const targets = intent.frameworks || await suggestFrameworks(prompt);

    // Step 3: Agent Team Assembly
    const agents = [];
    if (intent.complexity > 7) {
      agents.push(new ProductAgent(), new ArchitectAgent());
    }
    agents.push(new CodeAgent(targets), new QAAgent());

    // Step 4: MCP Tool Registration
    const tools = await registry.getToolsForFrameworks(targets);

    // Step 5: Execution Plan
    return {
      agents,
      tools,
      sandboxConfig: getSandboxConfig(targets),
      previewConfig: getPreviewConfig(targets),
      deployTargets: context.preferences?.deploy || []
    };
  }
}
```

### Multi-Agent Collaboration Protocol

```
1. Planning Phase (Agents debate internally)
   ProductAgent: "User wants task app → need auth, CRUD, real-time sync"
   ArchitectAgent: "Recommend: React Native + Supabase + LiveQuery"
   CodeAgent: "Can generate Expo template + Supabase client in 45s"
   QAAgent: "Will add Jest tests + E2E flow for login"

2. Consensus Check
   - If agents disagree >2 rounds → escalate to user: "Which approach?"
   - If consensus → proceed to generation

3. Generation Phase (Parallel execution)
   - CodeAgent generates frontend
   - ArchitectAgent generates backend schema
   - QAAgent generates tests concurrently

4. Validation Phase
   - QAAgent runs static analysis + test simulation
   - If failures → loop back to CodeAgent with error context
   - If passes → package for preview

5. Delivery Phase
   - Stream code to editor with syntax highlighting
   - Spin up preview environments
   - Notify user: "Your app is ready! 👉 [Preview] [Edit] [Deploy]"
```

### 7.2 Live Preview Infrastructure

### WebContainers Integration (Web Apps)

```tsx
// sandbox-manager.ts
import { WebContainer } from '@webcontainer/api';

class WebPreviewSandbox {
  async spawn(project: GeneratedProject): Promise<PreviewSession> {
    // 1. Initialize isolated WebContainer
    const container = await WebContainer.boot();

    // 2. Mount project files
    await container.fs.mkdir('/app');
    for (const [path, content] of Object.entries(project.files)) {
      await container.fs.writeFile(`/app/${path}`, content);
    }

    // 3. Install dependencies (cached node_modules)
    await container.spawn('npm', ['install'], { cwd: '/app' });

    // 4. Start dev server
    const server = await container.spawn('npm', ['run', 'dev'], {
      cwd: '/app',
      env: { PORT: '3000' }
    });

    // 5. Proxy to iframe
    const previewUrl = await this.getProxyUrl(container, 3000);

    return {
      url: previewUrl,
      terminal: server.output,
      controls: {
        restart: () => server.kill() && this.spawn(project),
        execute: (cmd) => container.spawn(cmd, { cwd: '/app' })
      }
    };
  }
}
```

### Mobile Preview Proxy (React Native / Flutter)

```
Architecture:
[CASHEWNUT Backend] ←gRPC→ [Preview Orchestrator] ←WebSocket→ [Expo/Flutter Service]

Flow:
1. User generates RN app → CASHEWNUT calls Expo Snack API
2. Snack returns session ID + embed URL
3. CASHEWNUT wraps URL in secure iframe with:
   - Device frame overlay (iPhone/Android toggle)
   - Console log streaming via Snack WebSocket
   - Hot-reload bridge to CASHEWNUT editor
4. For physical device: Generate QR code linking to snack.expo.dev

Security:
- All preview sessions isolated per user/project
- Network requests from preview sandboxed via CORS + CSP
- No persistent storage in preview environments
```

### 7.3 Real-Time Collaboration Engine

### CRDT Data Model (Yjs Schema)

```tsx
// collaborative-doc.ts
import * as Y from 'yjs';

export class CollaborativeProject {
  // Shared data structures
  yFiles: Y.Map<Y.Text>;          // File contents (CRDT text)
  yCursors: Y.Map<Y.Map<any>>;    // User cursor positions + selections
  yChat: Y.Array<Y.Map<any>>;     // Chat messages with AI/human metadata
  yAgents: Y.Map<Y.Map<any>>;     // AI agent states + internal notes
  yHistory: Y.Array<Y.Map<any>>;  // Version history with AI annotations

  // Awareness for presence
  awareness: Awareness;           // y-webrtc awareness for online users

  // Sync methods
  syncWithRemote(roomId: string): void {
    const provider = new WebsocketProvider(
      'wss://collab.cashewnut.dev',
      roomId,
      this.doc,
      { awareness: this.awareness }
    );
  }

  // Conflict resolution hooks
  onCodeEdit(userId: string, path: string, delta: Delta): void {
    // 1. Validate edit against file permissions
    // 2. Run AI compliance check if enterprise plugin active
    // 3. Broadcast to other clients via CRDT
    // 4. Update preview if edit affects rendered output
  }
}
```

### Presence & Communication Protocol

```
WebSocket Message Types:
{
  type: "cursor_update",
  userId: "user_123",
  payload: {
    file: "src/App.tsx",
    position: { line: 42, ch: 15 },
    selection: { start: ..., end: ... },
    color: "#FF6B6B"  // Avatar color
  }
}

{
  type: "ai_agent_update",
  agentId: "qa_agent_001",
  payload: {
    status: "writing_tests",
    progress: 0.7,
    currentFile: "src/__tests__/login.test.tsx",
    internalNote: "Adding edge case for invalid email"
  }
}

{
  type: "chat_message",
  sender: "user_456" | "agent_architect",
  payload: {
    text: "Should we use React Query or SWR for data fetching?",
    mentions: ["@ArchitectAgent"],
    attachments: [{ type: "code_snippet", content: "..." }]
  }
}
```

---

## 📊 8. Success Metrics & KPIs

### 8.1 Product Metrics (North Star + Supporting)

| Metric | Target (MVP) | Target (GA) | Measurement Method |
| --- | --- | --- | --- |
| **North Star**: Prompt-to-Deploy Success Rate | 40% | 75% | Analytics: prompt → generation → preview → deploy funnel |
| Time-to-First-Preview | <45s (web), <120s (mobile) | <20s (web), <60s (mobile) | Performance monitoring + RUM |
| Collaboration Engagement | 25% of sessions have ≥2 humans | 60% of sessions have ≥2 humans | Session analytics + CRDT event logs |
| Code Quality Score | 85% of generated code passes lint/tests | 95% pass + 30% include tests | Static analysis + test runner integration |
| Framework Coverage | 5 core frameworks at launch | 20+ frameworks via plugins | Plugin registry metrics |
| User Retention (D30) | 35% | 60% | Cohort analysis via auth events |
| Enterprise Adoption | 10 pilot customers | 100+ enterprise seats | Sales CRM + usage telemetry |

### 8.2 Technical Health Metrics

```yaml
Reliability:
  - Generation success rate: >99%
  - Preview session uptime: >99.5%
  - CRDT sync conflict rate: <0.1% of edits

Performance:
  - P95 prompt processing time: <15s
  - P95 preview load time: <3s after generation
  - WebSocket message latency: <100ms P99

Security:
  - Sandbox escape attempts: 0 (with automated pentesting)
  - Data leakage incidents: 0
  - Plugin vulnerability scan: 100% of plugins scanned pre-install

Cost Efficiency:
  - Cost per generated app: <$0.15 (blended compute + AI)
  - Preview session cost: <$0.02/minute
  - AI token optimization: 30% reduction via caching + smaller models for simple tasks
```

### 8.3 User Satisfaction Metrics

- **NPS Target**: +50 at GA (measured via in-app survey post-deploy)
- **CSAT for Generation Quality**: ≥4.5/5 (post-generation micro-survey)
- **Task Success Rate**: ≥90% (usability testing: "Build a login flow" task)
- **Collaboration Delight Score**: ≥4.7/5 (post-session survey: "How easy was it to work with teammates/AI?")

---

## 🗓️ 9. Roadmap & Phasing

### Phase 1: Foundation MVP (Q2-Q3 2026)

```
GOAL: Validate core loop for web apps with collaboration
SCOPE:
✅ Next.js/React + Tailwind generation (v0-compatible)
✅ WebContainers live preview in-browser
✅ CRDT-based real-time editing (Yjs + Liveblocks)
✅ Claude Code SDK integration with 3 custom MCP tools
✅ Vercel deployment integration
✅ Basic "Coworkers" invite + presence

OUT OF SCOPE:
❌ Mobile/desktop framework support
❌ Multi-agent orchestration
❌ Plugin system
❌ Self-hosting option

SUCCESS CRITERIA:
- 1,000 beta users generate 5,000+ web apps
- 40% prompt-to-deploy success rate
- NPS ≥ +30
- P95 generation time <30s
```

### Phase 2: Multi-Platform Expansion (Q4 2026-Q1 2027)

```
GOAL: Extend to mobile + desktop with production-ready previews
SCOPE:
✅ React Native generator + Expo Snack preview
✅ Electron generator + desktop proxy preview
✅ Flutter Web preview support
✅ Multi-agent "Coworkers" system (Product/Architect/Code/QA agents)
✅ Plugin marketplace MVP (5 official plugins)
✅ Advanced collaboration: voice notes, task assignment, AI agent @mentions

OUT OF SCOPE:
❌ Native iOS/Android builds (beyond Expo)
❌ Self-hosted deployment
❌ Advanced enterprise features (RBAC, audit logs)

SUCCESS CRITERIA:
- 30% of projects use non-web frameworks
- Mobile preview session success rate >85%
- Collaboration features used in 50% of team sessions
- Plugin installation rate: 20% of active users
```

### Phase 3: Enterprise & Scale (Q2-Q3 2027)

```
GOAL: Enable enterprise adoption and ecosystem growth
SCOPE:
✅ Self-hosted CASHEWNUT option (Docker + local LLM support)
✅ Advanced RBAC, SSO, audit logging for enterprises
✅ Custom plugin SDK + private registry
✅ Native mobile build queue (EAS + GitHub Actions integration)
✅ AI fine-tuning portal (train on team's codebase, opt-in)
✅ Advanced analytics: code quality trends, team velocity insights

OUT OF SCOPE:
❌ On-premise air-gapped deployment (Phase 4)
❌ Full IDE replacement (VS Code extension comes later)

SUCCESS CRITERIA:
- 10+ enterprise contracts signed
- Self-hosted instances: 99.95% uptime SLA met
- Plugin ecosystem: 50+ community plugins
- Enterprise NPS ≥ +60
```

### Phase 4: Ecosystem & Innovation (Q4 2027+)

```
GOAL: Become the universal development layer
SCOPE:
✅ CASHEWNUT Marketplace: templates, plugins, AI agents
✅ VS Code / JetBrains extension for hybrid workflow
✅ AI Agent Studio: no-code builder for custom agent behaviors
✅ On-premise air-gapped deployment for highly regulated industries
✅ Research initiatives: code generation evaluation framework, ethical AI guidelines

SUCCESS CRITERIA:
- 100K+ monthly active developers
- 500+ plugins in marketplace
- Recognized as leader in Gartner Magic Quadrant for AI DevTools
```

---

## ⚠️ 10. Risks & Mitigations

| Risk | Impact | Probability | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| **AI hallucination generates insecure code** | Critical | Medium | • Multi-stage validation: static analysis + QA agent + user approval gates<br>• Enterprise mode: require human review for production deploys<br>• Bug bounty program for generated code vulnerabilities | CTO / Security Lead |
| **Preview infrastructure costs spiral** | High | High | • Aggressive caching: reuse WebContainers for similar projects<br>• Auto-shutdown: preview sessions expire after 15min inactivity<br>• Tiered pricing: free tier has limited preview minutes | Head of Infra / Finance |
| **Framework fragmentation overwhelms roadmap** | Medium | High | • Plugin-first architecture: community builds framework support<br>• Prioritize by usage data: expand frameworks based on user demand<br>• "Framework Request" voting system in community | Head of Product |
| **Real-time collaboration at scale is technically hard** | High | Medium | • Start with Yjs + Liveblocks (proven stack)<br>• Load test early: simulate 10K concurrent CRDT sessions<br>• Fallback: if CRDT fails, switch to operational transform with conflict prompts | Engineering Lead |
| **Claude API costs make unit economics unsustainable** | Critical | Medium | • Hybrid model routing: simple tasks → smaller/cheaper models<br>• Aggressive prompt caching + response deduplication<br>• Enterprise tier: allow BYO API keys or local LLMs | CTO / AI Research |
| **Legal: IP ownership of AI-generated code** | High | Low | • Clear ToS: user owns all generated code<br>• Opt-in training: never use user code to train models without explicit consent<br>• Enterprise contracts: custom IP terms available | Legal / Product |
| **Security: Sandbox escape in preview environments** | Critical | Low | • Defense in depth: WebContainers (browser) + gVisor/Firecracker (server)<br>• Regular third-party pentests + bug bounties<br>• Network policies: preview envs have no outbound internet by default | Security Lead |

---

## 🚀 11. Go-to-Market Strategy

### 11.1 Launch Phases

```
Pre-Launch (Q1 2026):
• Private alpha with 50 developer influencers
• Collect testimonials + case studies
• Build waitlist via "Build your dream app in 60s" interactive demo

MVP Launch (Q3 2026):
• Public beta: free tier + pro trial
• Launch on Product Hunt, Hacker News, dev.to
• Partner with Vercel/Expo for co-marketing

Growth (Q4 2026-Q1 2027):
• Content engine: "CASHEWNUT Builds [Trending App]" YouTube series
• Community: plugin hackathons, agent design contests
• Sales: outbound to startups + freelance communities

Enterprise (Q2 2027+):
• Dedicated sales team for mid-market/enterprise
• Compliance certifications: SOC 2, ISO 27001
• Reference customers: case studies with recognizable brands
```

### 11.2 Pricing Strategy

| Tier | Price | Target User | Key Features |
| --- | --- | --- | --- |
| **Hobby** | Free | Students, side projects | • 100 generation credits/month<br>• Web preview only<br>• Public projects only<br>• Community support |
| **Pro** | $29/user/month | Freelancers, startups | • 2,000 credits/month + rollover<br>• All preview types (web/mobile/desktop)<br>• Real-time collaboration (up to 5 coworkers)<br>• Priority generation queue<br>• Email support |
| **Team** | $79/user/month (min 5) | Small teams, agencies | • Everything in Pro +<br>• Unlimited collaboration<br>• Shared plugin library<br>• Advanced analytics<br>• SLA: 99.5% uptime<br>• Dedicated Slack channel |
| **Enterprise** | Custom | Large orgs, regulated industries | • Everything in Team +<br>• Self-hosted deployment option<br>• SSO/SAML, RBAC, audit logs<br>• Custom AI fine-tuning<br>• 24/7 premium support<br>• Custom SLAs + legal terms |

*Credit System: 1 credit = ~1 generation of a small app. Complex apps cost more credits (transparent pricing calculator in UI).*

### 11.3 Key Partnerships

- **Cloud Providers**: Vercel (web deploy), Expo (mobile), AWS/Azure (enterprise MCP tools)
- **AI Infrastructure**: Anthropic (Claude), [Together.ai](http://together.ai/) (local model fallback), Hugging Face (model hub)
- **Developer Communities**: GitHub Education, freeCodeCamp, React Native Directory
- **Design Tools**: Figma (plugin for design-to-code), Storybook (component documentation)

---

## 📎 12. Appendix

### 12.1 API Specification Snippets

### MCP Tool: generate_react_native

```json
{
  "name": "generate_react_native",
  "description": "Generate a complete React Native/Expo project from a natural language prompt",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string", "description": "Natural language description of the app" },
      "features": {
        "type": "array",
        "items": { "enum": ["auth", "database", "payments", "maps", "camera"] }
      },
      "designSystem": { "type": "string", "enum": ["tailwind", "nativebase", "custom"] },
      "includeTests": { "type": "boolean", "default": true }
    },
    "required": ["prompt"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "project": { "$ref": "#/definitions/GeneratedProject" },
      "previewUrl": { "type": "string", "format": "uri" },
      "nextSteps": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

### Collaboration Event: CRDT Sync Payload

```json
{
  "type": "yjs-update",
  "roomId": "proj_abc123",
  "userId": "user_456",
  "update": "<base64-encoded Yjs binary update>",
  "meta": {
    "timestamp": 1709012345678,
    "file": "src/screens/Home.tsx",
    "operation": "text-insert",
    "aiAssisted": true,
    "agentId": "code_agent_002"
  }
}
```

### 12.2 Data Models (Simplified)

```tsx
// core/types.ts
interface GeneratedProject {
  id: string;
  userId: string;
  prompt: string;
  frameworks: Framework[];
  files: Record<string, { content: string; language: string }>;
  dependencies: Record<string, string>;
  previewConfig: PreviewConfig;
  deployConfig?: DeployConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface PreviewConfig {
  type: 'web' | 'mobile' | 'desktop';
  provider: 'webcontainers' | 'expo-snack' | 'flutter-web' | 'proxy';
  sessionUrl: string;
  expiresAt: Date;
  deviceEmulation?: 'iphone' | 'android' | 'desktop';
}

interface CollaborativeSession {
  roomId: string;
  projectId: string;
  participants: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
    isAI: boolean;
    agentType?: 'product' | 'architect' | 'code' | 'qa';
  }>;
  crdtState: YjsStateSnapshot; // Serialized Y.Doc state
  createdAt: Date;
}
```

### 12.3 Compliance & Legal Checklist

- [ ]  GDPR/CCPA compliance: data processing agreements, right to deletion
- [ ]  AI transparency: disclose AI-generated code, allow opt-out of training
- [ ]  IP clarity: ToS states user owns all generated code; CASHEWNUT claims no ownership
- [ ]  Security certifications roadmap: SOC 2 Type I (GA), Type II (12 months post-GA)
- [ ]  Export controls: screen for sanctioned regions in self-hosted deployments

### 12.4 Open Questions (To Resolve in Discovery)

1. How to handle framework versioning? (e.g., React 18 vs 19, Flutter 3.x)
2. What's the fallback when AI generation fails? (manual mode? template library?)
3. How to price "complexity" fairly without frustrating users?
4. What's the minimal viable plugin API to enable community framework support?
5. How to balance AI autonomy vs user control in multi-agent mode?

---

## ✅ Approval Signatures

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Product Lead | __________________ | __________________ | ______ |
| Engineering Lead | __________________ | __________________ | ______ |
| Design Lead | __________________ | __________________ | ______ |
| AI Research Lead | __________________ | __________________ | ______ |
| Security Lead | __________________ | __________________ | ______ |
| Legal Counsel | __________________ | __________________ | ______ |
| CEO | __________________ | __________________ | ______ |

---

> **CASHEWNUT PRD v1.0**
> 
> 
> *"Empowering every creator to build anything, anywhere, with anyone."*
> 
> 🥜 Let's build the future of development, together.
> 

---

**Next Steps**:

1. Engineering spike: WebContainers + CRDT integration prototype (2 weeks)
2. Design sprint: Core workspace UI + collaboration flows (1 week)
3. AI research: MCP tool schema finalization + agent prompt engineering (ongoing)
4. Legal review: ToS + privacy policy draft for AI-generated code (1 week)

**Document History**:

- v0.1 (Feb 10, 2026): Initial draft
- v0.5 (Feb 18, 2026): Stakeholder feedback incorporated
- v1.0 (Feb 25, 2026): Approved for development

*This document is living. Update via PR to `/docs/prd-cashewnut.md` in the internal repo.*