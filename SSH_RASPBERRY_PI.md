# SSH into Raspberry Pi - Quick Guide

This guide shows how to SSH into your Raspberry Pi from Windows.

## Quick SSH Command

```bash
ssh pi@192.168.254.200
```

**Default credentials:**
- **Username:** `pi` (or your custom username)
- **Password:** (set during Raspberry Pi setup)

---

## Step-by-Step Instructions

### 1. Open PowerShell or Command Prompt

- Press `Win + X` → Select "Windows PowerShell" or "Terminal"
- Or press `Win + R` → Type `powershell` → Press Enter

### 2. SSH Command

```bash
ssh pi@192.168.254.200
```

**Replace `pi` with your username if different.**

### 3. First-Time Connection

The first time you connect, you'll see:
```
The authenticity of host '192.168.254.200' can't be established.
ECDSA key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and press Enter.

### 4. Enter Password

You'll be prompted for the password:
```
pi@192.168.254.200's password:
```

Type your password (characters won't show for security) and press Enter.

**Note:** If you haven't set a password or forgot it, you'll need to:
- Connect a keyboard and monitor to the Pi
- Or reset the password via physical access

### 5. You're In!

Once connected, you should see:
```
pi@raspberrypi:~ $
```

You're now connected and can run commands on the Raspberry Pi.

---

## Alternative: Using PuTTY (Windows GUI)

If you prefer a GUI tool:

1. **Download PuTTY:**
   - Download from: https://www.putty.org/
   - Or install via: `winget install PuTTY.PuTTY`

2. **Configure PuTTY:**
   - **Host Name (or IP address):** `192.168.254.200`
   - **Port:** `22`
   - **Connection type:** `SSH`
   - Click "Open"

3. **Login:**
   - Username: `pi`
   - Password: (your password)

---

## Common Issues and Solutions

### "Connection refused" or "Network unreachable"

**Possible causes:**
1. Raspberry Pi is not powered on
2. Wrong IP address
3. Pi is not on the same network
4. SSH is not enabled on the Pi

**Solutions:**
```bash
# Check if Pi is reachable
ping 192.168.254.200

# If ping fails, check network connection
ipconfig  # Check your computer's IP address
```

**Enable SSH on Raspberry Pi:**
- Connect keyboard/monitor to Pi
- Run: `sudo systemctl enable ssh`
- Run: `sudo systemctl start ssh`
- Or use: `sudo raspi-config` → Interface Options → SSH → Enable

### "Permission denied (password)"

**Possible causes:**
1. Wrong password
2. Wrong username
3. SSH key authentication required

**Solutions:**
- Double-check password (case-sensitive)
- Try default password: `raspberry` (if never changed)
- Check username: default is `pi`

### "Host key verification failed"

This happens if the Pi's SSH key changed (e.g., after reinstalling OS).

**Solution:**
```bash
# Remove the old key from known_hosts
ssh-keygen -R 192.168.254.200

# Then try connecting again
ssh pi@192.168.254.200
```

### "SSH client not found" (Windows)

Windows 10/11 includes SSH by default. If you get this error:

**Solution:**
1. **Enable OpenSSH:**
   - Settings → Apps → Optional Features
   - Search for "OpenSSH Client"
   - Install if not installed

2. **Or use PowerShell:**
   - PowerShell usually has SSH enabled by default

---

## Finding Your Raspberry Pi's IP Address

If you're not sure of the IP address:

### On Raspberry Pi (if you have access):

```bash
# Show IP address
hostname -I

# Or
ip addr show

# For WiFi
ip addr show wlan0

# For Ethernet
ip addr show eth0
```

### From Your Computer:

```bash
# Scan network for Raspberry Pi
arp -a | findstr "b8:27:eb"
# (Raspberry Pi Foundation MAC addresses start with b8:27:eb, dc:a6:32, or e4:5f:01)

# Or use nmap (if installed)
nmap -sn 192.168.254.0/24
```

---

## Copy Files to/from Raspberry Pi

### Using SCP (Secure Copy)

**Copy file TO Raspberry Pi:**
```bash
scp "local-file.txt" pi@192.168.254.200:/home/pi/
```

**Copy file FROM Raspberry Pi:**
```bash
scp pi@192.168.254.200:/home/pi/file.txt ./
```

**Copy entire directory:**
```bash
scp -r "local-folder/" pi@192.168.254.200:/home/pi/
```

### Example: Copy Bluetooth Script

```bash
# Copy the Bluetooth sender script to Pi
scp "sensor code/thermal_sensor/bluetooth-thermal-sender.py" pi@192.168.254.200:/home/pi/
```

---

## Passwordless SSH (Optional - Advanced)

To avoid entering password every time:

### 1. Generate SSH Key (on your computer)

```bash
ssh-keygen -t rsa -b 4096
# Press Enter to accept default location
# Optionally set a passphrase
```

### 2. Copy Key to Raspberry Pi

```bash
ssh-copy-id pi@192.168.254.200
```

### 3. Test

```bash
ssh pi@192.168.254.200
# Should connect without password prompt
```

---

## Useful Commands Once Connected

```bash
# Check current directory
pwd

# List files
ls -la

# Navigate to home directory
cd ~

# Check system info
uname -a

# Check disk space
df -h

# Check running processes
ps aux

# Check system status
sudo systemctl status ssh

# Exit SSH session
exit
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Connect via SSH** | `ssh pi@192.168.254.200` |
| **Copy file to Pi** | `scp file.txt pi@192.168.254.200:/home/pi/` |
| **Copy file from Pi** | `scp pi@192.168.254.200:/home/pi/file.txt ./` |
| **Ping Pi** | `ping 192.168.254.200` |
| **Exit SSH** | `exit` or `Ctrl+D` |

---

## For Your Thermal Sensor Setup

Once connected via SSH, you can:

1. **Copy the Bluetooth script:**
   ```bash
   # From your computer
   scp "sensor code/thermal_sensor/bluetooth-thermal-sender.py" pi@192.168.254.200:/home/pi/
   ```

2. **Install dependencies:**
   ```bash
   # On Raspberry Pi (via SSH)
   sudo apt update
   sudo apt install python3-bluetooth python3-pip
   pip3 install pybluez
   ```

3. **Run the script:**
   ```bash
   # On Raspberry Pi (via SSH)
   cd /home/pi
   python3 bluetooth-thermal-sender.py
   ```

---

## Summary

✅ **Basic command:** `ssh pi@192.168.254.200`  
✅ **Default username:** `pi`  
✅ **IP address:** `192.168.254.200` (from your config)  
✅ **First-time:** Type `yes` when prompted about host key  
✅ **Password:** Enter your Raspberry Pi password  

If you run into issues, check the "Common Issues and Solutions" section above!

