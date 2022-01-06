![icon](images/icon.png)

# Script Buttons for VSCode

Make running custom scripts easier!

## Features

When a package.json file is detected in the current workspace folder a button is created on the status bar for each script. When this button is clicked it runs the script in a terminal. Only 1 instance of each script can run at a given time.

![scripts](images/scripts.png)

Scripts can also be loaded in from a script-buttons.json file. Npm scripts will be white whereas non-npm scripts will be grey.

![scripts](images/script-buttons.json.png)

When no scripts can be found a warning message will be displayed.

![no-scripts](images/no-scripts.png)

> Tip: If you have since added a package.json/script-buttons.json file or have modified existing scripts clicking the refresh button will attempt to find scripts again and update the buttons...

## Extension Settings

This extension currently has no settings.

## Known Issues

There are currently no known issues.

## Release Notes

### 1.1.0

Added the ability to define scripts without a package.json file, this is done using a script-buttons.json file.

### 1.0.0

Initial release.
