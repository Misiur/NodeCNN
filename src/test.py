#!/usr/bin/python
import sys
eaprint("Python start")
sys.stdout.flush()

i = 0
for line in sys.stdin.readline():
    print(line)
    sys.stdout.flush()
    i += 1
    if i > 2:
        break

print("python end")