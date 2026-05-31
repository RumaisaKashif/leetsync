import requests
import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from github.pusher import push_file, get_folder, build_notes, build_details

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
        code
        notes
        runtimePercentile
        memoryPercentile
        question {
            difficulty
            topicTags {
                name
            }
        }
    }
}
"""

def fetch_code(submission_id):
    response = session.post(
        "https://leetcode.com/graphql",
        headers=headers,
        json={"query": details_query, "variables": {"submissionId": int(submission_id)}}
    )
    return response.json()["data"]["submissionDetails"]

def handler(event, context):
    all_accepted = []
    offset = 0
    limit = 20

    while True:
        response = session.post(
            "https://leetcode.com/graphql",
            headers=headers,
            json={"query": list_query, "variables": {"offset": offset, "limit": limit, "lastKey": None}}
        )
        submissions = response.json()["data"]["submissionList"]["submissions"]
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
    unique_accepted = list(seen.values())
    print(f"Unique problems solved: {len(unique_accepted)}")

    pushed = 0
    for item in unique_accepted:
        details = fetch_code(item["id"])
        if not details or not details.get("question"):
            print(f"Skipped (no details): {item['title']}")
            continue

        tags = [t["name"] for t in details["question"]["topicTags"]]
        folder = get_folder(tags)
        slug = item["titleSlug"]
        base_path = f"{folder}/{slug}"
        ext = "py" if item["lang"] == "python3" else item["lang"]

        push_file(f"{base_path}/solution.{ext}", details["code"], f"Add solution: {item['title']}")
        push_file(f"{base_path}/notes.md", build_notes(item, details), f"Add notes: {item['title']}")
        push_file(f"{base_path}/details.md", build_details(item, details), f"Add details: {item['title']}")

        print(f"Pushed: {item['title']} → {base_path}/")
        pushed += 1
        time.sleep(0.5)

    return {"statusCode": 200, "pushed": pushed}

if __name__ == "__main__":
    result = handler({}, {})
    print(result)
