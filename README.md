# CVTE / MaxHub CRCP Protocol Reverse Engineering Specification

> Comprehensive protocol analysis, JNI entrypoints, and architecture specification reverse-engineered from `GAIAShare.apk` (MaxHub / CVTE ScreenShare client) and its native engine `libcrcp_bundle.so`.

---

## 1. Overview

**CRCP (CVTE Remote Control Protocol)** is a high-performance proprietary IoT and screen-casting protocol developed by Guangzhou Shirui Electronics / CVTE (found across millions of Android TV motherboards, smart interactive panels, and MaxHub conference screens).

It powers:
1. **Low-Latency Screen Mirroring** (Forward: Phone/PC $\to$ TV).
2. **Desktop Sync / Reverse Mirroring** (Backward: TV screen $\to$ Phone).
3. **Multi-Touch and Mouse Injection** (Phone screen controls TV cursor and multi-touch gestures).
4. **Virtual TV Remote Keystrokes** (Home, Back, Menu, Volume, Navigation).
5. **BYOD Audio & Camera Streaming** (Wireless mic and camera pass-through).

---

## 2. Network Discovery & Transport Layer

### Service Discovery
* **mDNS / Bonjour Service Type**: `_maxhubmobile._tcp.local`
* **Port Discovery**: Dynamic allocation managed through mDNS TXT records (`ss-crcpPort`, `ss-intranetIp`).
* **Underlying Engine**: ZeroMQ (`libzmq`) embedded inside `libcrcp_bundle.so` supporting both TCP unicast and UDP multicast broadcast.

### Authentication & Pairing
* **PIN / AirCode System**: Managed by `com.cvte.maxhub.aircode.AirCodeManager`.
* **Verification Flow**:
  1. TV displays a 4-to-6 alphanumeric "AirCode" / PIN on screen.
  2. Mobile client initiates handshake with `AirCodeManager.checkPin()`.
  3. `Crcp.VerificationCodeChecker` validates the challenge against the TV session.
  4. Symmetric crypto handshake: Negotiates **SM4** or AES encryption session keys (`useSm4First()`).

---

## 3. Remote Control & Touch Input Architecture

The input layer is split into high-level Java abstractions and native ZeroMQ C++ event serialisers:

```
[Touch / Key Event]
        │
        ▼
com.cvte.maxhub.crcp.input.client.RemoteTouchClient
        │
        ▼
com.cvte.maxhub.crcp.input.client.TouchEncoder (JNI)
        │
        ▼
libcrcp_bundle.so (ZeroMQ packet framing & SM4 encryption)
        │
        ▼  (TCP / UDP)
TV Server (`com.maxhub.screenshare.server.tv`)
        │
        ▼
Linux Kernel / Android Input Injection (`/dev/uinput` or `InputManager`)
```

### JNI Native Entrypoints for Touch & Mouse (`TouchEncoder`)
From `libcrcp_bundle.so`:

| Method | Parameters | Description |
|---|---|---|
| `TouchEncoder_absPointDownMT` | `(x, y, pointerId)` | Multi-touch finger press down |
| `TouchEncoder_absPointMoveMT` | `(x, y, pointerId)` | Multi-touch finger drag / swipe |
| `TouchEncoder_absPointUpMT` | `(x, y, pointerId)` | Multi-touch finger release |
| `TouchEncoder_mouseClick` | `(x, y, button)` | Mouse button click |
| `TouchEncoder_mouseMove` | `(x, y)` | Mouse cursor translation |
| `TouchEncoder_wheelForward` | `(delta)` | Mouse scroll wheel up |
| `TouchEncoder_wheelBackward` | `(delta)` | Mouse scroll wheel down |
| `TouchEncoder_keyDown` | `(keyCode)` | Remote key press |
| `TouchEncoder_keyUp` | `(keyCode)` | Remote key release |

### Supported Virtual Remote Keys
Identified in `com.cvte.maxhub.mobile.protocol.newprotocol.remotecontrol.RemoteKey`:
* `HOME`
* `BACK`
* `MENU`
* `UP` / `DOWN` / `LEFT` / `RIGHT`
* `OK` / `ENTER`
* `VOLUME_UP` / `VOLUME_DOWN`
* `POWER`

---

## 4. Screen Mirroring (Video & Audio)

### Video Subsystem
* **Decoder Pipeline**: `com.cvte.maxhub.mobile.protocol.newprotocol.remotecontrol.decoder.AsyncVideoHwDecoder`
* **Video Format**: H.264 / AVC video streams delivered inside CRCP frames.
* **Receiving Interface**: `com.cvte.maxhub.crcp.video.receiver.MirrorReceiver` $\to$ `IVideoSink`.

### Audio Subsystem
* **Codec**: Opus (`libopusutil-lib.so`).
* **Sink / Source**: `MirrorAudioClient` $\leftrightarrow$ `MirrorAudioServer`.

---

## 5. Repository Structure

```
├── README.md                  # Complete architectural & protocol overview
├── jni_crcp_methods.txt       # Full dump of all 317 CRCP JNI native export symbols
├── classes.dex_classes.txt    # Java class package structure of the CRCP subsystem
└── scripts/
    └── crcp_discover.py       # Standalone mDNS / socket scanner for CVTE CRCP TVs
```

---

## 6. How AI Agents & Projects Can Leverage This

With this documentation, developers and AI agents can:
1. **Build a headless CRCP Python client**: Connect directly to CVTE smart TVs and MaxHub displays to send commands without ADB.
2. **Automate TV testing**: Send simulated remote commands and touch sequences.
3. **Capture TV frames**: Pipe the reverse mirroring video stream into multimodal LLMs (e.g. Gemini / Claude) for visual UI understanding and autonomous navigation.
