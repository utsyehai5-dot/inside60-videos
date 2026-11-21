import json
q = json.load(open("queue.json"))
for it in q:
    if it["status"] == "todo":
        print(json.dumps(it, indent=1)); break
else:
    print("QUEUE EMPTY")
