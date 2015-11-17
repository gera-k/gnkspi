# gnkspi
SPI driver and tools for Win10 IoT [Light Controller](https://www.hackster.io/gera_k/rpi2-win10-iot-based-light-controller-e73990) project 
## Tools
- Rpi2 board running Windows 10 IoT build 10556.
- Visual Studio 2015.
- Windows Driver Kit 2015.

## Kernel driver
The kernel driver gnkspi replaces the SPI driver that comes with Win IoT. Note that _standard_ SPI API becomes unavailable as soon as you install this driver.

1. Compiling the driver.
 - Open the solution **gnkspi.sln** and select the **gnkspi** project. Make sure that platform is set to **ARM** and configuration to **Release**. 
 - Do Rebuild Project. Driver files will be put into ARM/Release directory. 
 - You need .sys and .inf files. Copy them into your Rpi2 into directory of your choice.

2. Installing the driver
 - Run Power Shell and connect to your Rpi2 as documented in [Using PowerShell](http://ms-iot.github.io/content/en-US/win10/samples/PowerShell.htm).
 - cd to directory where driver files are located and do:
 
		   devcon update .\gnkspi.inf ACPI\BCM2838
           Updating drivers for ACPI\BCM2838 from C:\Users\Gera\Documents\gnkspi.inf.
           Drivers installed successfully.`
    
 - Verify that driver is installed and started:
 
		   devcon status ACPI\BCM2838
           ACPI\BCM2838\0
              Name: CNKSpi Driver
              Driver is running.
           1 matching device(s) found.
           
           
## gnkctl - driver test tool
The **gnkctl** command line utility allows testing of the kernel driver API. It can also be used to briefly validate light show files in json format.

1. Compiling the gnkctl.
 - Select project **gnkctl** and ensure that platform/configuration are set to **ARM** and **Release**.
 - Rebuild the project. The utility binary can be found in the ARM/Release directory.
 - Copy the **gnkctl.exe** to your Rpi2 board.
 - Also copy test files showX.json to Rpi2.
 
2. Running tests
 - Login to your Rpi2 using PowerShell.
 - cd to directory where you have copied the utility.
 - to get optopns help:
 
 			.\gnkctl -h

 - to list available gnkspi devices:
 
 			.\gnkctl list
			List GNK devices
			0: \\?\ACPI#BCM2838#0#{de0dbb94-7f49-415d-80f6-168b6872e2b3}

 - to start light show defined by a json file:
 
 			.\gnkctl -d 0 show .\show1.json

 - to stop the show
 
 			.\gnkctl -d 0 stop
            
    