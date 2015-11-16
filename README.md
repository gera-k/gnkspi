# gnkspi
SPI driver and tools for Win10 IoT
## Tools
- Rpi2 board running Windows 10 IOT build 10556.
- Visual Studio 2015.
- Windows Driver Kit 2015.

## Kernel driver
The kernel driver gnkspi replaces the SPI driver that come sith Win IoT. All _standard_ SPI API becomes unavailable as soon as you install this driver.
1. Compiling the driver.
Open the solution **gnkspi.sln** and select the **gnkspi** project. Make sure that platform is set to **ARM** and configuration to **Release**. Do Rebuild Project. Driver files will be put into ARM/Release directory. You need .sys and .inf files. Copy them into your Rpi2 into directory of your choice.
2. Installing the driver








