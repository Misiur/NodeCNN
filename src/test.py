#!/usr/bin/python
import sys

print("Python start")
sys.stdout.flush()

while True:
    line = sys.stdin.readline()
    if not line:
        continue

    print(line)
    sys.stdout.flush()

print("python end")