# Reset Raspberry Pi Password Guide

If you forgot your Raspberry Pi password, here are several ways to reset it.

## Option 1: Physical Access (Easiest - Recommended)

If you have physical access to the Raspberry Pi (keyboard, monitor, or via serial console):

### Step 1: Boot to Single-User Mode

1. **Connect keyboard and monitor to Raspberry Pi**
2. **Power on the Pi**
3. **During boot, when you see the kernel boot messages, press keys to interrupt boot**
4. **Edit boot options:**
   - Press `e` to edit (if using GRUB)
   - Or look for bootloader menu
   - For Raspberry Pi OS, hold `Shift` during boot

**Alternative method (Raspberry Pi OS):**
- Boot the Pi normally
- On the login screen, you can't log in, but there's another way...

### Step 2: Edit Boot Configuration

**For Raspberry Pi OS (Raspbian):**

1. **Remove SD card from Pi**
2. **Insert SD card into your computer** (using card reader)
3. **Navigate to the boot partition** (first partition, usually visible as a drive)
4. **Edit `cmdline.txt` file:**

   - Open `cmdline.txt` in a text editor
   - Find the line starting with `console=...`
   - **Add at the end of the line (before any newline):**
     ```
     init=/bin/sh
     ```
   - Save the file

5. **Safely eject the SD card**
6. **Insert SD card back into Pi**
7. **Boot the Pi**

### Step 3: Reset Password

1. **The Pi will boot directly to a root shell** (no password required)
2. **Mount the filesystem read-write:**
   ```bash
   mount -o remount,rw /
   ```
3. **Reset password for user `pi`:**
   ```bash
   passwd pi
   ```
   - Enter new password (twice)
   - Or reset root password: `passwd root`

4. **Reboot:**
   ```bash
   exec /sbin/init
   ```
   Or: `sync; reboot`

5. **Remove the `init=/bin/sh` from cmdline.txt** (otherwise it will boot to shell every time)
   - Remove SD card
   - Edit `cmdline.txt` on your computer
   - Remove `init=/bin/sh`
   - Put SD card back

---

## Option 2: Using Raspberry Pi Imager (if you have the SD card)

If you can access the SD card and use Raspberry Pi Imager:

### Step 1: Use Raspberry Pi Imager

1. **Download Raspberry Pi Imager:**
   - https://www.raspberrypi.com/software/

2. **Insert SD card into your computer**

3. **Use "Customize" option before writing:**
   - Click the gear icon (⚙️) in Raspberry Pi Imager
   - Set username and password
   - Enable SSH if needed
   - Configure WiFi if needed

4. **Write the image** (this will erase everything, so backup first if needed)

**Note:** This will reinstall the OS, so you'll lose all data.

---

## Option 3: SSH Key Method (if you have an SSH key)

If you previously set up SSH keys (passwordless login):

```bash
# Try connecting with SSH key
ssh -i ~/.ssh/id_rsa pi@192.168.254.200

# If it works, you're in without password!
# Then reset password:
passwd
```

---

## Option 4: Serial Console (Advanced)

If you have a USB-to-Serial adapter:

1. **Connect serial adapter to Pi's GPIO pins**
2. **Open serial terminal** (PuTTY, screen, minicom)
3. **Boot Pi and access serial console**
4. **Reset password in console**

---

## Option 5: Default Password

If you never changed the password, try:

**Raspberry Pi OS default credentials:**
- **Username:** `pi`
- **Password:** `raspberry`

**Try this first:**
```bash
ssh pi@192.168.254.200
# Password: raspberry
```

---

## Quick Reference: Reset Password (Physical Access)

**Fastest method if you have SD card access:**

1. Remove SD card from Pi
2. Insert SD card into computer
3. Edit `cmdline.txt` in boot partition:
   - Add `init=/bin/sh` at the end of the line
4. Put SD card back in Pi
5. Boot Pi (it will boot to shell)
6. Run: `mount -o remount,rw /`
7. Run: `passwd pi` (enter new password)
8. Run: `sync; reboot`
9. Remove SD card, remove `init=/bin/sh` from cmdline.txt
10. Put SD card back, boot normally

---

## Prevention: Enable SSH Key Authentication

After resetting, set up SSH keys to avoid this in the future:

### On Your Computer:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096

# Copy key to Raspberry Pi (after resetting password)
ssh-copy-id pi@192.168.254.200
```

Then you can SSH without a password!

---

## Summary

✅ **Fastest:** Try default password `raspberry` first  
✅ **Physical access:** Edit `cmdline.txt` to boot to shell, reset password  
✅ **SD card access:** Use Raspberry Pi Imager to customize before writing  
✅ **Prevention:** Set up SSH keys after resetting

**Most likely scenario:** If you never changed it, the password is probably `raspberry` (default).

