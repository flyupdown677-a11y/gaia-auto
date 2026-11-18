#!/usr/bin/env python3
"""
CVTE / MaxHub CRCP TV Discovery Script
Scans the local subnet for CVTE smart TVs and MaxHub ScreenShare services.
"""

import socket
import sys

def probe_tv(ip):
    print(f"[*] Checking {ip} for CVTE / MaxHub services...")
    ports = {
        8008: "Cast/DIAL (Media)",
        9909: "CVTE Web Dashboard",
        7433: "CRCP Web/API Service",
        7434: "CRCP Control/Discovery UDP",
        4321: "CVTE ScreenShare Daemon"
    }
    
    found = []
    for port, desc in ports.items():
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.3)
        res = s.connect_ex((ip, port))
        if res == 0:
            found.append((port, desc))
        s.close()
        
    if found:
        print(f"[+] Found active TV at {ip}:")
        for port, desc in found:
            print(f"    - Port {port}: {desc}")
    else:
        print(f"[-] No CVTE services detected on {ip}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "192.168.0.111"
    probe_tv(target)
