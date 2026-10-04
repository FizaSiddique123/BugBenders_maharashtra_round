import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    res = requests.get(f"{BASE_URL}/api/jobs")
    print("Jobs:", res.json())

if __name__ == "__main__":
    run_test()
