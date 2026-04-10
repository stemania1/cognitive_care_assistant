# Fix: "externally-managed-environment" Error on Raspberry Pi

Newer Raspberry Pi OS versions prevent system-wide pip installs to protect system Python packages. Here are solutions:

## Quick Fix Options

### Option 1: Use --break-system-packages Flag (Quick & Easy)

For system scripts that need hardware access (like sensor scripts):

```bash
pip3 install pybluez --break-system-packages
```

**When to use:** Installing packages for system scripts that need to access hardware (like your thermal sensor script)

**Pros:** Quick, works immediately  
**Cons:** Bypasses system protection (but fine for single-purpose Pi)

---

### Option 2: Install to User Directory (Recommended)

Install packages in your user directory instead of system-wide:

```bash
pip3 install --user pybluez
```

**When to use:** For user scripts, safer option

**Pros:** Safer, doesn't modify system Python  
**Cons:** May have PATH issues if scripts run as different user

**Note:** Make sure `~/.local/bin` is in your PATH:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

### Option 3: Use apt Package Manager (When Available)

For packages available in Raspberry Pi repositories:

```bash
# Try apt first (most packages won't be available)
sudo apt install python3-pybluez

# For adafruit packages, use pip with --break-system-packages
pip3 install adafruit-blinka adafruit-circuitpython-amg88xx --break-system-packages
```

**When to use:** When packages are in official repos (rare for specialized packages)

**Pros:** System-managed, safer  
**Cons:** Most specialized packages (pybluez, adafruit libraries) aren't in repos

---

### Option 4: Virtual Environment (Most Safe, More Complex)

Create a virtual environment for your project:

```bash
# Install venv
sudo apt install python3-venv python3-full

# Create virtual environment
python3 -m venv ~/thermal-sensor-env

# Activate virtual environment
source ~/thermal-sensor-env/bin/activate

# Install packages
pip install pybluez adafruit-blinka adafruit-circuitpython-amg88xx

# Run your script with virtual environment active
python3 bluetooth-thermal-sender.py

# Deactivate when done
deactivate
```

**When to use:** For development projects, multiple projects

**Pros:** Completely isolated, safest  
**Cons:** More complex, need to activate before running scripts

**For your thermal sensor script:** You'd need to activate the venv before running, or modify the script to use the venv Python path.

---

## Recommended Solution for Your Thermal Sensor Script

Since you're running a system script that needs hardware access, use **Option 1**:

```bash
# Install required packages
pip3 install pybluez --break-system-packages
pip3 install adafruit-blinka adafruit-circuitpython-amg88xx --break-system-packages
```

**Why:** 
- Your script needs to access hardware (AMG8833 sensor, Bluetooth)
- It's a single-purpose Pi for this project
- Simplest solution for system scripts
- Works with systemd services

---

## Complete Installation for Thermal Bluetooth Setup

Here's the complete installation command:

```bash
# Update system
sudo apt update

# Install system packages
sudo apt install python3-bluetooth python3-pip python3-dev libbluetooth-dev python3-smbus i2c-tools

# Install Python packages (using --break-system-packages for system scripts)
pip3 install pybluez --break-system-packages
pip3 install adafruit-blinka adafruit-circuitpython-amg88xx --break-system-packages
```

---

## Why This Error Happens

Raspberry Pi OS (based on Debian 12+) uses PEP 668 to prevent accidental system Python modification. This protects system packages but requires flags or virtual environments for user-installed packages.

---

## Summary

✅ **For your thermal sensor script:** Use `--break-system-packages` flag  
✅ **For system scripts:** Option 1 (--break-system-packages)  
✅ **For user scripts:** Option 2 (--user)  
✅ **For development:** Option 4 (virtual environment)

**Quick command:**
```bash
pip3 install pybluez adafruit-blinka adafruit-circuitpython-amg88xx --break-system-packages
```

