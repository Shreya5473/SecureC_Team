
import asyncio
from app.services.github_fetcher import fetch_github_artifact

async def test():
    urls = [
        "https://github.com/Shreeya1-pixel/webn",
        "https://github.com/Shreeya1-pixel/derivf.git"
    ]
    for url in urls:
        print(f"Testing {url}...")
        try:
            res = fetch_github_artifact(url)
            print(f"Success! Found {len(res['content']['files'])} files.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
