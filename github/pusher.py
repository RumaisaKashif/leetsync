import requests
import base64
import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
GITHUB_REPO = os.getenv("GITHUB_REPO")

BASE_URL = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents"

headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def get_file_sha(path):
    """Get SHA of existing file (needed to update it)."""
    response = requests.get(f"{BASE_URL}/{path}", headers=headers)
    if response.status_code == 200:
        return response.json()["sha"]
    return None

def push_file(path, content, commit_message):
    """Create or update a file in the GitHub repo."""
    encoded = base64.b64encode(content.encode()).decode()
    sha = get_file_sha(path)

    payload = {"message": commit_message, "content": encoded}
    if sha:
        payload["sha"] = sha  # required when updating an existing file

    response = requests.put(f"{BASE_URL}/{path}", headers=headers, json=payload)
    return response.status_code in [200, 201]

def get_folder(tags):
    """Pick folder name from first meaningful topic tag."""
    tag_map = {
        "Array": "arrays",
        "String": "strings",
        "Hash Table": "hash-tables",
        "Linked List": "linked-lists",
        "Tree": "trees",
        "Binary Tree": "trees",
        "Binary Search Tree": "trees",
        "Dynamic Programming": "dynamic-programming",
        "Graph": "graphs",
        "Stack": "stack-and-queue",
        "Queue": "stack-and-queue",
        "Sliding Window": "sliding-window",
        "Two Pointers": "two-pointers",
        "Binary Search": "binary-search",
        "Recursion": "recursion",
        "Math": "math",
    }
    for tag in tags:
        if tag in tag_map:
            return tag_map[tag]
    return "other"

def build_notes(item, details):
    """User's personal notes saved on LeetCode for this submission."""
    note_text = details.get("notes") or "_No notes added for this submission._"
    return f"# Notes — {item['title']}\n\n{note_text}\n"

def build_details(item, details):
    """Auto-generated submission stats."""
    tags = [t["name"] for t in details["question"]["topicTags"]]
    return f"""# {item['title']}

**Difficulty:** {details['question']['difficulty']}
**Tags:** {', '.join(tags)}
**Language:** {item['lang']}
**Runtime Percentile:** {round(details.get('runtimePercentile') or 0, 1)}%
**Memory Percentile:** {round(details.get('memoryPercentile') or 0, 1)}%
"""
