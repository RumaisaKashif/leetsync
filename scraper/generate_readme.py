import requests
import json
import os
import time
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
from github.pusher import push_file, get_folder, build_readme

load_dotenv()

LEETCODE_SESSION = os.getenv("LEETCODE_SESSION")
CSRF_TOKEN = os.getenv("CSRF_TOKEN")

session = requests.Session()
session.cookies.set("LEETCODE_SESSION", LEETCODE_SESSION)
session.cookies.set("csrftoken", CSRF_TOKEN)

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com/submissions/",
    "Origin": "https://leetcode.com",
    "x-csrftoken": CSRF_TOKEN,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}

list_query = """
query submissionList($offset: Int!, $limit: Int!, $lastKey: String) {
    submissionList(offset: $offset, limit: $limit, lastKey: $lastKey) {
        submissions {
            id
            statusDisplay
            lang
            timestamp
            title
            titleSlug
        }
    }
}
"""

details_query = """
query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
        question {
            difficulty
            topicTags { name }
        }
    }
}
"""

# Fetch all accepted, deduplicated
all_accepted, offset, limit = [], 0, 20
while True:
    resp = session.post("https://leetcode.com/graphql", headers=headers,
                        json={"query": list_query, "variables": {"offset": offset, "limit": limit, "lastKey": None}})
    submissions = resp.json()["data"]["submissionList"]["submissions"]
    for item in submissions:
        if item["statusDisplay"] == "Accepted":
            all_accepted.append(item)
    if len(submissions) < limit:
        break
    offset += limit

seen = {}
for item in all_accepted:
    if item["titleSlug"] not in seen:
        seen[item["titleSlug"]] = item
unique = list(seen.values())

# Fetch details for each to get difficulty and tags
all_problems = []
for item in unique:
    resp = session.post("https://leetcode.com/graphql", headers=headers,
                        json={"query": details_query, "variables": {"submissionId": int(item["id"])}})
    details = resp.json()["data"]["submissionDetails"]
    tags = [t["name"] for t in details["question"]["topicTags"]]
    folder = get_folder(tags)
    ext = "py" if item["lang"] == "python3" else item["lang"]
    all_problems.append({
        "title": item["title"],
        "slug": item["titleSlug"],
        "lang": item["lang"],
        "ext": ext,
        "folder": folder,
        "difficulty": details["question"]["difficulty"],
    })
    print(f"Collected: {item['title']}")
    time.sleep(0.5)

readme_content = build_readme(all_problems)
push_file("README.md", readme_content, "Update README with full problem list")
print("\nREADME pushed successfully.")
