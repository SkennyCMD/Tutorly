# 📱 Progressive Web App (PWA) Guide

This document outlines the architecture, setup, and caching strategies of the Progressive Web App (PWA) features integrated into the Tutorly frontend. By functioning as a PWA, Tutorly offers an app-like, installable experience with built-in network resilience for tutors and users.

---

**Document**: 12_PWA_Guide.md  
**Last Updated**: March 21, 2026  
**Version**: 1.0.0  
**Author**: Tutorly Development Team  

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Caching Strategies](#caching-strategies)
- [Offline Experience](#offline-experience)
- [Update Mechanism](#update-mechanism)
- [Testing the PWA](#testing-the-pwa)

---

## Overview

The Tutorly Node.js interface is fully equipped with PWA capabilities. This allows tutors and users to install the web app on their mobile devices or desktops, and helps mitigate issues with unstable network connections through dynamic client-side caching. 

**Main PWA Capabilities:**
- **Installability**: Can be added to the home screen (Standalone display mode).
- **Network Resilience**: Uses an intelligent service worker to cache static assets and dynamic requests.
- **Offline Fallback**: Displays a dedicated offline page rather than the generic browser error when the network is unreachable.
- **OTA Updates**: Prompts the user to refresh the app gracefully when a new service worker logic is pushed.

---

## Core Components

The PWA implementation relies on three main files within the codebase:

### 1. Web App Manifest (`public/manifest.json`)
Defines the visual behavior of the installed application.
- **Name/Short Name**: Tutorly
- **Display**: `standalone` (hides browser UI natively)
- **Theme/Background Color**: `#0a0a0a` (Matching the dark theme UI)
- **Icons**: Fetches the SVG custom Tutorly logo (`/icons/icon.svg`).

### 2. Service Worker (`public/service-worker.js`)
The core script running in the background. It intercepts network requests, manages the local browser `caches` API, and servers responses depending on the predefined strategies.

### 3. Client Registration (`views/partials/pwa-setup.ejs`)
Injected in the `<head>` of all primary EJS views. It links the `manifest.json`, sets Apple touch icons, and handles the lifecycle and registration of the `service-worker.js`.

---

## Caching Strategies

The service worker employs a split-logic strategy depending on the resource being requested. The cache is continuously versioned (e.g., `tutorly-cache-v1-[DATE]`).

### 1. Install & Pre-caching
On installation, the precise array of `STATIC_ASSETS` is pre-fetched and saved into the cache. This includes core CSS (`home.css`), core JavaScript (`homeScript.js`, `modalShared.js`), logos, the manifest, and the dedicated `/offline.html` page.

### 2. Static Assets: *Stale-While-Revalidate*
Whenever a static asset is requested, the service worker immediately serves the local cached version (fast loading) whilst simultaneously triggering a network fetch to refresh the cache in the background. 

### 3. API & Navigation: *Network-First*
For dynamic EJS HTML pages (`Mode: navigate`) and backend API calls, we rely on the network. 
- If the network request **succeeds** (Method `GET`, Status `200`), the response is cloned and saved dynamically into the cache.
- If the network request **fails**, the script intercepts the failure and attempts to look up the last successful response inside the cache, guaranteeing continuity for recently visited paths.

### 4. Bypass Rules
Any route starting with `/admin` (including `/adminLogin`) is **explicitly excluded** from the service worker caching logic to ensure Administration areas are strictly real-time and unaffected by stale cache logic.

---

## Offline Experience

When a user fully loses connectivity and requests an un-cached HTML navigation page, the service worker provides an elegant fallback:
1. It intercepts the failed navigation request.
2. It attempts to serve the pre-cached `/offline.html` file.
3. As an extreme safeguard, if `/offline.html` fails, it returns a hardcoded HTML response (`<html><body><h1>Offline</h1>...`) to prevent the PWA wrapper from breaking.

---

## Update Mechanism

To prevent users from being stuck on an older version of the web app:
1. The `pwa-setup.ejs` script listens to `updatefound` on the SW registration.
2. When the backend deploys a new `service-worker.js`, the browser detects the byte-change.
3. A JavaScript `confirm()` dialog is fired: *"New version available! Reload to update?"*
4. If accepted, the page forcefully reloads, bypassing the active worker and refreshing the view with the newly installed cache. Unused/older caches are automatically deleted during the `activate` event.

---

## Testing the PWA

To test the PWA features during local development:
1. Launch the frontend server (`npm run dev` or `npm run https`).
2. Open Chrome/Edge and access Developer Tools (`F12`).
3. Navigate to the **Application** tab.
4. Under **Manifest**, verify that Tutorly's icon and standalone settings are recognized.
5. Under **Service workers**, verify it is registered and running.
6. Check **Cache Storage** to see the populated `tutorly-cache-v1-...`
7. In the **Network** tab, toggle the dropdown to **Offline** and refresh the page to observe the service worker serving cached data and the `offline.html` page.