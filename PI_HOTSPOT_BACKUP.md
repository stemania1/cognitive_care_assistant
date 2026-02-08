# Raspberry Pi backup WiFi (iPhone hotspot)

Use your iPhone hotspot as a backup network so the Pi can get online when your main WiFi isn’t available. Once connected, you can SSH to the Pi or use the app over WiFi (set the Pi’s IP when on the hotspot).

**Hotspot SSID:** `Corbin's Phone`  
**Password:** *(use your hotspot password when running the commands below; do not commit it to the repo)*

---

## Raspberry Pi OS Bookworm (NetworkManager)

1. SSH into the Pi (or use keyboard/monitor).

2. Create a connection file (replace `YOUR_PASSWORD` with your hotspot password):

   ```bash
   sudo nano /etc/NetworkManager/system-connections/corbins-phone.nmconnection
   ```

   Paste the following and **replace `YOUR_PASSWORD`** with the real password:

   ```ini
   [connection]
   id=Corbin's Phone
   type=wifi

   [wifi]
   mode=infrastructure
   ssid=Corbin's Phone

   [wifi-security]
   key-mgmt=wpa-psk
   psk=YOUR_PASSWORD

   [ipv4]
   method=auto

   [ipv6]
   method=auto
   ```

   Save (Ctrl+O, Enter, Ctrl+X).

3. Set permissions:

   ```bash
   sudo chmod 600 /etc/NetworkManager/system-connections/corbins-phone.nmconnection
   ```

4. Tell NetworkManager to reload:

   ```bash
   sudo nmcli connection reload
   ```

5. Turn on the iPhone hotspot. The Pi should connect when it sees "Corbin's Phone" (and when it can’t reach the main WiFi or it’s preferred).

To force a connection to the hotspot:

```bash
sudo nmcli connection up "Corbin's Phone"
```

---

## Raspberry Pi OS Bullseye or older (wpa_supplicant)

1. SSH into the Pi.

2. Generate a config block (run this and **type your hotspot password when prompted**):

   ```bash
   wpa_passphrase "Corbin's Phone"
   ```

   You’ll get a block like:

   ```
   network={
           ssid="Corbin's Phone"
           #psk="..."
           psk=hex_or_plain_password
   }
   ```

3. Append that block to the supplicant config:

   ```bash
   sudo wpa_passphrase "Corbin's Phone" >> /tmp/hotspot.conf
   # Review /tmp/hotspot.conf, then append the network{ } part to wpa_supplicant:
   sudo bash -c 'cat /tmp/hotspot.conf >> /etc/wpa_supplicant/wpa_supplicant.conf'
   sudo rm /tmp/hotspot.conf
   ```

   Or in one go (password will be in shell history; run `history -c` after if needed):

   ```bash
   sudo wpa_passphrase "Corbin's Phone" "YOUR_PASSWORD" | sudo tee -a /etc/wpa_supplicant/wpa_supplicant.conf
   ```
   Replace `YOUR_PASSWORD` with your hotspot password.

4. Restart WiFi or reboot:

   ```bash
   sudo wpa_cli -i wlan0 reconfigure
   # or
   sudo reboot
   ```

---

## After the Pi is on the hotspot

- **IP address:** The Pi will get an IP from the hotspot (often 172.20.10.x). Check on the Pi with `hostname -I` or from the iPhone: Settings → Cellular → Cellular Data Network (or the hotspot screen may list connected devices).
- **SSH:** `ssh pi@<that-ip>`
- **App:** If the app talks to the Pi over WiFi, set the Pi’s IP in the app (or in `sensor-config.ts`) to that IP when you’re using the hotspot, or use Bluetooth as in **PI_BLUETOOTH_NO_WIFI_LOCAL_APP.md**.

Keeping the hotspot password out of the repo: use it only when you run the commands above (or type it into `nano`); don’t commit it to git.
