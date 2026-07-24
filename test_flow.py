import subprocess
import time

def run_adb(cmd):
    result = subprocess.run(f"adb {cmd}", shell=True, capture_output=True, text=True)
    return result.stdout.strip()

def click_text(text, wait=2):
    print(f"Clicking on '{text}'...")
    # This might fail if the text is not immediately found, so we retry a few times
    for _ in range(3):
        try:
            # Dump UI hierarchy
            run_adb("shell uiautomator dump")
            # Pull it
            run_adb("pull /sdcard/window_dump.xml .")
            with open("window_dump.xml", "r", encoding="utf-8") as f:
                content = f.read()
            
            # Find coordinates of the node containing the text
            # This is a very basic parser for demonstration
            import re
            match = re.search(r'text="([^"]*' + re.escape(text) + r'[^"]*)".*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', content, re.IGNORECASE)
            
            if match:
                x1, y1, x2, y2 = map(int, match.groups()[1:])
                x = (x1 + x2) // 2
                y = (y1 + y2) // 2
                run_adb(f"shell input tap {x} {y}")
                time.sleep(wait)
                return True
        except Exception as e:
            print(f"Error finding '{text}': {e}")
        time.sleep(2)
        
    print(f"Could not find '{text}'.")
    return False

def take_screenshot(name):
    print(f"Taking screenshot: {name}.png")
    run_adb(f"exec-out screencap -p > {name}.png")

print("Starting automated test...")

# Ensure app is started (assuming it's built and installed)
# The package name comes from app.json / android build
app_pkg = "com.diasporatrust.manager"
run_adb(f"shell am force-stop {app_pkg}")
time.sleep(1)
run_adb(f"shell monkey -p {app_pkg} -c android.intent.category.LAUNCHER 1")
time.sleep(5) # Wait for initial load

take_screenshot("1_home_screen")

# Click on a pending task
if click_text("Pending", wait=3) or click_text("Test Verification Task", wait=3):
    take_screenshot("2_task_detail_pending")
    
    # Click "Verify Land"
    if click_text("Verify Land", wait=4):
        take_screenshot("3_verify_land_screen")
        
        # Click "Record Measurement"
        click_text("Record Measurement", wait=3)
        take_screenshot("4_measurement_recorded")
        
        # Go back
        run_adb("shell input keyevent 4")
        time.sleep(2)
        
    take_screenshot("5_back_to_task_detail")
    
    # Click Submit
    if click_text("Submit Task", wait=3):
        take_screenshot("6_after_submit")
        click_text("OK") # Dismiss alert
        
else:
    print("Could not find a pending task to click.")

print("Test complete.")
