const https = require('https');
const fs = require('fs');

// Constants
const STORAGE_FILE = 'previous-issues.json';
const TARGET_LABELS = ['help wanted', 'external'];

// GitHub API Functions
async function fetchIssues(owner, repo, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues?state=open&per_page=100`,
      method: 'GET',
      headers: {
        'User-Agent': 'Expensify-External-Label-Notifier',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const issues = JSON.parse(data);
            resolve(issues);
          } catch (error) {
            reject(new Error(`Error parsing JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Storage Functions
function loadPreviousIssues() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Warning: Could not load previous issues: ${error.message}`);
  }
  return [];
}

function saveIssues(issues) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(issues, null, 2));
    console.log(`Saved ${issues.length} issues to ${STORAGE_FILE}`);
  } catch (error) {
    console.error(`Error saving issues: ${error.message}`);
  }
}


function filterIssuesByLabels(issues) {
  return issues.filter(issue => {
    const labelNames = issue.labels.map(label => label.name.toLowerCase());
    return TARGET_LABELS.some(targetLabel => labelNames.includes(targetLabel));
  });
}

function findNewIssues(currentIssues, previousIssues) {
  const previousIssueNumbers = new Set(previousIssues.map(issue => issue.number));
  return currentIssues.filter(issue => !previousIssueNumbers.has(issue.number));
}

// Notification Functions
async function sendNotification(topic, title, message, priority = 3) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      topic: topic,
      title: title,
      message: message,
      priority: priority,
      tags: ['warning', 'computer'],
      click: 'https://github.com/Expensify/App/issues?q=is%3Aissue%20state%3Aopen%20label%3AExternal%20label%3A%22Help%20Wanted%22',
    });

    const options = {
      hostname: 'ntfy.sh',
      method: 'POST',
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('📱 Notification sent successfully');
          resolve(responseData);
        } else {
          reject(new Error(`ntfy.sh returned status ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Notification failed: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const ntfyTopic = process.env.NTFY_TOPIC;

  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!owner || !repo) {
    console.error('Error: REPO_OWNER and REPO_NAME environment variables are required');
    process.exit(1);
  }

  try {
    console.log(`Fetching issues from ${owner}/${repo}...`);
    const issues = await fetchIssues(owner, repo, token);
    
    const filteredIssues = filterIssuesByLabels(issues);

    console.log(`Found ${issues.length} open issues, ${filteredIssues.length} with "Help Wanted" or "External" labels`);
    
    // Load previous issues to detect new ones
    const previousIssues = loadPreviousIssues();
    const newIssues = findNewIssues(filteredIssues, previousIssues);
    
    if (newIssues.length > 0) {
      console.log(`\n🆕 Found ${newIssues.length} new issues:`);

      // Create notification message
      const issuesList = newIssues.map((issue, index) =>
        `${index + 1}. Issue #${issue.number}\n   ${issue.title}\n   ${issue.html_url}`
      ).join('\n\n');

      const notificationMessage = `Found ${newIssues.length} new external/help-wanted issues:\n\n${issuesList}`;

      // Send notification if topic is configured
      if (ntfyTopic) {
        try {
          await sendNotification(
            ntfyTopic,
            '🆕 New Expensify Issues',
            notificationMessage,
            4
          );
        } catch (error) {
          console.error(`Failed to send notification: ${error.message}`);
        }
      }

      // Log issues to console
      newIssues.forEach((issue, index) => {
        console.log(`${index + 1}. #${issue.number} - ${issue.title}`);
        console.log(`   Created: ${new Date(issue.created_at).toISOString()}`);
        console.log(`   Labels: ${issue.labels.map(label => label.name).join(', ') || 'None'}`);
        console.log(`   URL: ${issue.html_url}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No new issues found since last check');
    }
    
    // Save current filtered issues for next comparison
    saveIssues(filteredIssues);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}