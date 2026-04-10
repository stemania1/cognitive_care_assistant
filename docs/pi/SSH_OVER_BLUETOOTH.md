# SSH (and Console) Over Bluetooth

You have two ways to get a **terminal** on the Pi when you have no Wi‑Fi or USB:

1. **Bluetooth PAN** – Real **SSH** over a Bluetooth network (Pi gets an IP, you `ssh pi@<that-ip>`).
2. **Bluetooth serial (RFCOMM)** – **Serial console** over Bluetooth (e.g. PuTTY to a COM port). Not SSH, but full shell access.

---

## Option 1: SSH over Bluetooth (PAN – Personal Area Network)

The Pi acts as a small “network” over Bluetooth. Your PC connects to that network, gets an IP, and you SSH as usual.

**Do the setup on the Pi while you still have Wi‑Fi or another way in (e.g. keyboard/monitor).**

### On the Pi (one-time, over Wi‑Fi/SSH)

1. **Install dependencies and PAN server**

   ```bash
   sudo apt update
   sudo apt install -y pulseaudio bluez dnsmasq
   git clone https://github.com/bablokb/pi-btnap.git
   cd pi-btnap/tools
   sudo ./install-btnap server
   ```

2. **Disable the SAP plugin** so Bluetooth PAN can work:

   Edit `/etc/systemd/system/bluetooth.target.wants/bluetooth.service` (path may be `/lib/systemd/system/bluetooth.service` on some images). Set:

   ```ini
   ExecStart=/usr/lib/bluetooth/bluetoothd --noplugin=sap
   ```
   (Or on some systems: `ExecStart=/usr/libexec/bluetooth/bluetoothd --noplugin=sap`)

3. **Configure the Bluetooth network**

   Edit `/etc/btnap.conf` (created by install-btnap). Example:

   ```bash
   MODE="server"
   BR_DEV="br0"
   BR_IP="192.168.20.99/24"   # Pi’s IP – you’ll SSH to this
   BR_GW="192.168.20.1"
   ```

   Ensure the range matches what `dnsmasq` uses (check `cat /etc/dnsmasq.conf` for `dhcp-range`).

4. **Enable and start services**

   ```bash
   sudo systemctl enable bluetooth btnap dnsmasq hciuart
   sudo systemctl restart hciuart bluetooth dnsmasq btnap
   ```

5. **Pair your PC from the Pi**

   ```bash
   bluetoothctl
   > agent on
   > default-agent
   > scan on
   ```
   Find your PC’s Bluetooth MAC address in the list, then:

   ```text
   > pair XX:XX:XX:XX:XX:XX
   > trust XX:XX:XX:XX:XX:XX
   > quit
   ```

6. **Reboot**

   ```bash
   sudo reboot
   ```

### On Windows (each time you want SSH)

1. Open **Settings → Bluetooth & devices**. Ensure the Pi is **paired** and **connected** (you may need to click it to connect to the “network”).
2. In PowerShell or Command Prompt:

   ```powershell
   ssh pi@192.168.20.99
   ```

   Use the IP you set as `BR_IP` in `/etc/btnap.conf` (without the `/24`). If the Pi doesn’t hand out an IP to the PC, check that the PAN connection is active in Windows (Bluetooth device shows as “Connected”).

**References:** [Raspberry Pi SSH over Bluetooth](https://nano.dannyvacar.ca/post/2019-12-13-raspberry-pi-ssh-over-bluetooth/), [Pi Forums – SSH over Bluetooth (PAN)](https://forums.raspberrypi.com/viewtopic.php?t=318323).

---

## Option 2: Serial console over Bluetooth (RFCOMM) – no SSH

The Pi exposes a **serial port** over Bluetooth. You connect with a serial terminal (e.g. PuTTY) to that COM port. You get a login shell, not SSH (traffic is not encrypted). Good for one-off config or when PAN is too much.

**Do the setup on the Pi while you still have Wi‑Fi or keyboard/monitor.**

### On the Pi (one-time)

1. **Create RFCOMM service**

   ```bash
   sudo nano /etc/systemd/system/rfcomm.service
   ```

   Contents (replace `pi` with your username if different):

   ```ini
   [Unit]
   Description=RFCOMM serial console
   After=bluetooth.service
   Requires=bluetooth.service

   [Service]
   ExecStart=/usr/bin/rfcomm watch hci0 1 getty rfcomm0 115200 xterm -a pi
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

   To get a login prompt instead of auto-login, use only:

   ```ini
   ExecStart=/usr/bin/rfcomm watch hci0 1 getty rfcomm0 115200 xterm
   ```

2. **Bluetooth config**

   In `/etc/bluetooth/main.conf`, under `[General]`, add:

   ```ini
   DisablePlugins = pnat
   ```

   Edit the Bluetooth service file (often `/etc/systemd/system/bluetooth.target.wants/bluetooth.service` or `/lib/systemd/system/bluetooth.service`). Change `ExecStart` to enable the serial profile:

   ```ini
   ExecStart=/usr/lib/bluetooth/bluetoothd -C
   ExecStartPost=/usr/bin/sdptool add SP
   ```
   (Paths may be `usr/libexec/bluetooth/bluetoothd` on some images.)

3. **Enable and reboot**

   ```bash
   sudo systemctl enable rfcomm
   sudo reboot
   ```

### On Windows (each time)

1. **Pair the Pi:** Settings → Bluetooth → Add device → pair with the Pi.
2. **Find COM port:** Device Manager → Ports (COM & LPT) → note the COM port for “Standard Serial over Bluetooth link (…)”.
3. **Connect:** Open **PuTTY** → Connection type **Serial** → Serial line: `COM9` (your port), Speed: `115200` → Open. You get a login/console on the Pi.

So you don’t run `ssh` at all – you use a serial connection to the COM port. It’s “console over Bluetooth,” not SSH.

**Reference:** [Connect to a headless Raspberry Pi using Bluetooth](https://medium.com/@tomw3115/connect-to-a-headless-raspberry-pi-using-bluetooth-0e61c05e1b68) (RFCOMM + PuTTY).

---

## Summary

| Goal              | Use                    | Result                          |
|-------------------|------------------------|---------------------------------|
| Real SSH (encrypted, `ssh pi@IP`) | **Option 1: Bluetooth PAN** | Full SSH over Bluetooth network |
| Simple shell access, no SSH      | **Option 2: RFCOMM**   | Serial console via COM port (e.g. PuTTY) |

For your thermal app you don’t need SSH over Bluetooth: the **bluetooth-thermal-sender.py** on the Pi and **bluetooth-thermal-receiver.js** on the PC already send sensor data. Use SSH over Bluetooth only when you need to run commands on the Pi (e.g. start the sender, edit config) without Wi‑Fi or a keyboard/monitor.
