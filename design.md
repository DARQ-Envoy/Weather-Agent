# Weather Dashboard Design System Specification

## Product Vision

A premium AI-powered weather dashboard.

The experience should feel closer to:

* Apple Weather
* Vision Pro
* Arc Browser
* Linear
* Rivian
* Modern luxury SaaS

Not:

* Admin dashboard
* Analytics platform
* Enterprise software
* Generic Tailwind template

The interface should prioritize atmosphere, depth, spaciousness, and clarity.

---

# Design Principles

## 1. Atmosphere First

The weather background is the primary visual element.

UI sits on top of the weather.

The weather should feel alive.

The dashboard should never look like panels placed on a background image.

The UI should feel integrated into the environment.

---

## 2. Large Visual Hierarchy

The most important elements should dominate.

Priority order:

```text
1. Weather Condition
2. Temperature
3. AI Assistant
4. Supporting Weather Data
5. Navigation
```

The eye should immediately land on:

```text
Thunderstorms
22°
```

before anything else.

---

## 3. Glass Layers

Every surface exists on one of three depth layers.

### Layer 1

Navigation

```css
background: rgba(255,255,255,0.06)
blur: 20px
```

### Layer 2

Input

```css
background: rgba(255,255,255,0.08)
blur: 24px
```

### Layer 3

Cards

```css
background: rgba(255,255,255,0.10)
blur: 32px
```

Cards should always appear visually closer to the user than navigation.

---

# Layout System

## Main Grid

```css
grid-template-columns:
1.45fr
0.55fr;
```

Left side:

```text
Weather Content
```

Right side:

```text
Weather Cards
```

---

## Content Width

Hero content maximum width:

```css
760px
```

Never exceed.

---

## Sidebar Width

Fixed width:

```css
340px
```

---

# Spacing Scale

Only use:

```css
4
8
12
16
24
32
48
64
```

No arbitrary spacing values.

---

# Typography

Font:

```text
Inter
```

---

## Weather Title

```css
font-size: 88px
font-weight: 250
line-height: .92
letter-spacing: -.04em
```

Example:

```text
Thunderstorms
```

---

## Weather Subtitle

```css
font-size: 38px
font-weight: 300
```

---

## Body Text

```css
font-size: 16px
line-height: 1.7
```

---

## Temperature

```css
font-size: 140px
font-weight: 200
line-height: .9
```

The temperature must be the second largest element on screen.

---

# Color System

## Text

Primary:

```css
rgba(255,255,255,.96)
```

Secondary:

```css
rgba(255,255,255,.72)
```

Muted:

```css
rgba(255,255,255,.48)
```

---

## Glass

Light:

```css
rgba(255,255,255,.06)
```

Medium:

```css
rgba(255,255,255,.08)
```

Heavy:

```css
rgba(255,255,255,.12)
```

---

## Border

```css
rgba(255,255,255,.08)
```

---

# Background Treatment

The image should never appear raw.

Apply:

```css
linear-gradient(
180deg,
rgba(5,10,18,.15),
rgba(5,10,18,.75)
)
```

Plus:

```css
radial-gradient(
circle at center,
transparent,
rgba(0,0,0,.45)
)
```

Plus:

```css
rain texture overlay
```

Opacity:

```css
0.06
```

---

# Navigation

Position:

```text
Top Center
```

---

Container

```css
height: 60px
width: 260px
border-radius: 999px
```

---

Icons

Size:

```css
20px
```

Color:

```css
rgba(255,255,255,.75)
```

Hover:

```css
rgba(255,255,255,1)
```

---

# Weather Information Area

Contains:

```text
Weather Title
Subtitle
Description
Temperature
Location
AI Assistant
Forecast
```

Vertical rhythm:

```css
24px
32px
48px
```

Use consistent spacing.

---

# Location Row

Contains:

```text
Map Pin
New York
UV Index: 2
```

Gap:

```css
24px
```

Opacity:

```css
0.72
```

---

# Quick Action Chips

Height:

```css
34px
```

Padding:

```css
0 16px
```

Radius:

```css
999px
```

Background:

```css
rgba(255,255,255,.08)
```

Hover:

```css
rgba(255,255,255,.12)
```

Font:

```css
13px
```

---

# AI Input

Width:

```css
100%
```

Height:

```css
56px
```

Radius:

```css
999px
```

---

Background

```css
rgba(255,255,255,.08)
```

---

Border

```css
rgba(255,255,255,.08)
```

---

Placeholder

```css
rgba(255,255,255,.55)
```

---

Icons

Size:

```css
18px
```

Opacity:

```css
.7
```

---

# Floating AI Chat

## Position

Attached directly to input.

```css
left:0
right:0
width:100%
bottom:calc(100% + 12px)
```

The chat and input must have identical width.

No exceptions.

---

## Appearance

```css
border-radius:28px
```

Background:

```css
rgba(38,48,64,.90)
```

Backdrop:

```css
blur(36px)
```

Border:

```css
rgba(255,255,255,.08)
```

Shadow:

```css
0 40px 100px rgba(0,0,0,.35)
```

---

## Height

```css
min-height:240px
max-height:420px
```

---

# Chat Messages

## User Bubble

```css
max-width:75%
border-radius:18px
padding:10px 14px
```

Background:

```css
rgba(255,255,255,.08)
```

---

## Assistant Bubble

```css
max-width:85%
border-radius:18px
padding:14px
```

Background:

```css
rgba(255,255,255,.05)
```

---

# Reusable Card Architecture

Every card must inherit from:

```tsx
<GlassCard />
```

No duplicated glass styles.

---

# GlassCard

Responsible only for:

* blur
* border
* shadow
* radius
* surface color

Styles:

```css
background:
linear-gradient(
180deg,
rgba(255,255,255,.10),
rgba(255,255,255,.04)
);

backdrop-filter:
blur(32px);

border:
1px solid rgba(255,255,255,.08);

box-shadow:
0 10px 40px rgba(0,0,0,.18),
0 30px 80px rgba(0,0,0,.25);

border-radius:
28px;
```

---

# Wind Card

Height:

```css
220px
```

Layout:

```text
Title
Metric
Unit
Chart
```

Metric:

```css
56px
font-weight:300
```

---

# Sunrise Card

Height:

```css
180px
```

Contains:

```text
Sunrise
Sunset
Arc Visualization
```

Use SVG.

---

# AI Insight Card

Height:

```css
180px
```

Contains:

```text
Sparkles Icon
AI Insight
Insight Text
Confidence
Progress Bar
```

---

# Forecast Timeline

Single reusable component.

Must span full content width.

---

Structure

```text
Mon Tue Wed Thu Fri Sat Sun
```

Connected by one SVG path.

Not individual cards.

Not flex items with borders.

One continuous weather timeline.

---

# Component Architecture

```text
components/

layout/
  DashboardHeader.tsx

weather/
  HeroWeather.tsx
  WeatherAssistant.tsx
  WeatherInput.tsx
  FloatingChat.tsx
  ForecastTimeline.tsx

cards/
  GlassCard.tsx
  WindCard.tsx
  SunriseCard.tsx
  AIInsightCard.tsx

hooks/
  useFloatingChat.ts

types/
  weather.ts
```

---

# State Ownership

Page owns:

```ts
chatOpen
messages
weatherData
```

Cards own no global state.

Cards receive props only.

The page composes reusable components.

No visual implementation inside page component.

---

# Animation System

Use Framer Motion.

Duration:

```css
220ms
```

Easing:

```css
cubic-bezier(.22,1,.36,1)
```

Used for:

* chat open
* card appearance
* hover states
* progress bars

Never use bounce animations.

Never use spring animations.

Motion should feel calm and premium.
