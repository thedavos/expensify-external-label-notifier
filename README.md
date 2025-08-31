# Expensify External Label Notifier

An automated notification system that monitors the Expensify/App repository for new issues labeled "External" or "Help Wanted" and sends real-time notifications via ntfy.sh.

## Features

- **Automated Monitoring**: Runs every hour via GitHub Actions
- **Smart Filtering**: Only tracks issues with "External" or "Help Wanted" labels
- **New Issue Detection**: Compares against previously stored issues to identify new ones
- **Real-time Notifications**: Sends formatted notifications via ntfy.sh
- **Persistent Storage**: Maintains issue history in `previous-issues.json`

## Setup

### 1. Configure ntfy.sh Topic

1. Choose a unique topic name (e.g., `github-expensify-issues-123`)
2. Subscribe to the topic in your device:
   - **Mobile**: Install ntfy.sh app and subscribe to your topic
   - **Web**: Visit `https://ntfy.sh/your-topic-name`

### 2. Configure GitHub Repository

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add a new secret:
   - **Name**: `NTFY_TOPIC`
   - **Value**: Your chosen topic name

### 3. Enable GitHub Actions

The workflow will automatically start running hourly once configured.

## Local Testing

Test the script locally with your own credentials:

```bash
GITHUB_TOKEN=your_github_token \
REPO_OWNER=Expensify \
REPO_NAME=App \
NTFY_TOPIC=your_topic \
node index.js
```

## How It Works

1. **Fetch**: Retrieves open issues from Expensify/App repository
2. **Filter**: Keeps only issues with "External" or "Help Wanted" labels
3. **Compare**: Checks against previously stored issues to find new ones
4. **Notify**: Sends formatted notifications via ntfy.sh for new issues
5. **Store**: Updates `previous-issues.json` for next comparison

## Notification Format

Notifications include:
- Issue number and title
- Direct link to the issue
- Clickable notification that opens filtered issue view

## File Structure

- `index.js` - Main application logic
- `.github/workflows/notify-expensify-issues.yml` - GitHub Actions workflow
- `previous-issues.json` - Auto-generated issue storage (committed automatically)

## License

This project is licensed under the terms specified in the LICENSE file.