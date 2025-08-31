# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains an automated notification system that monitors Expensify/App repository for new issues labeled "External" or "Help Wanted" and sends notifications via ntfy.sh. The system runs hourly via GitHub Actions.

## Repository Structure

- `index.js` - Main Node.js script that fetches, filters, and processes GitHub issues
- `.github/workflows/notify-expensify-issues.yml` - GitHub Actions workflow that runs hourly
- `previous-issues.json` - Auto-generated storage file for tracking processed issues
- `README.md` - Project documentation
- `.gitignore` - Jekyll-specific ignore patterns

## Core Functionality

The `index.js` script is organized into logical sections:

### Constants & Configuration
- `STORAGE_FILE` - JSON file for persistent issue storage
- `TARGET_LABELS` - Array of labels to filter issues by

### GitHub API Functions
- `fetchIssues(owner, repo, token)` - Fetches open issues from GitHub API

### Storage Functions  
- `loadPreviousIssues()` - Loads previously processed issues from JSON
- `saveIssues(issues)` - Saves current issues to JSON for next comparison

### Utility Functions
- `filterIssuesByLabels(issues)` - Filters issues by target labels
- `findNewIssues(currentIssues, previousIssues)` - Identifies new issues

### Notification Functions
- `sendNotification(topic, title, message, priority)` - Sends notifications via ntfy.sh

## Required Environment Variables

- `GITHUB_TOKEN` - GitHub API token (automatically provided in Actions)
- `REPO_OWNER` - Repository owner (defaults to "Expensify")
- `REPO_NAME` - Repository name (defaults to "App") 
- `NTFY_TOPIC` - ntfy.sh topic for notifications (must be configured as secret)

## Testing Locally

Run with environment variables:
```bash
GITHUB_TOKEN=your_token REPO_OWNER=Expensify REPO_NAME=App NTFY_TOPIC=your_topic node index.js
```

## GitHub Actions Workflow

The workflow runs every hour and:
1. Fetches and filters issues from Expensify/App
2. Compares against previously stored issues  
3. Sends ntfy.sh notifications for new issues
4. Commits updated `previous-issues.json` back to repository