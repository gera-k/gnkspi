/********************************************************************************
The MIT License(MIT)

Copyright(c) 2015 Gera Kazakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files(the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions :

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
********************************************************************************/

#define INITGUID

#define _CRT_SECURE_CPP_OVERLOAD_STANDARD_NAMES 1
#define NOMINMAX
#include <windows.h>
#ifndef CTL_CODE
#include <winioctl.h>
#endif
#include <cfgmgr32.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>

#include "json.hpp"
#include "tclap/CmdLine.h"

#define DBG_MODULE "gnkctl"
#define DBG_LEVEL DbgLevel
extern int DBG_LEVEL;

#include "public.h"
#include "trace.h"
#include "Utils.h"
#include "Device.h"

using json = nlohmann::json;

int DBG_LEVEL = MSG_TR3;

bool optVerbose = false;
int optDevice = -1;
int optProperty = -1;
std::string optCommand;
std::string optFile;
std::string optOutput;

static const DEVPROPKEY *propertyList[] = {
    &gnkspiShow0, &gnkspiShow1, &gnkspiShow2, &gnkspiShow3, &gnkspiShow4,
    &gnkspiShow5, &gnkspiShow6, &gnkspiShow7, &gnkspiShow8, &gnkspiShow9
};

static int cmdLineParser(int argc, char **argv)
{
    int rc = 0;

    try
    {
        TCLAP::CmdLine cmdline("GNK Control Tool", ' ', "0.1");
        TCLAP::SwitchArg verbose("v", "verbose", "Be verbose", cmdline, false);
        TCLAP::ValueArg<int> device("d", "device", "Device index", false, -1, "index", cmdline);
        TCLAP::ValueArg<int> property("p", "property", "Persistent property index", false, -1, "index", cmdline);
        TCLAP::ValueArg<std::string> output("o", "output", "Output file", false, "", "File name", cmdline);
        TCLAP::UnlabeledValueArg<std::string> command("command", "Action to exec:  list, get, show, stop", true, "", "Action", cmdline);
        TCLAP::UnlabeledValueArg<std::string> file("file", "File name", false, "", "File name", cmdline);

        // Parse the argv array.
        cmdline.parse(argc, argv);

        optVerbose = verbose.getValue();
        optDevice = device.getValue();
        optProperty = property.getValue();
        optCommand = command.getValue();
        optFile = file.getValue();
        optOutput = output.getValue();
    }
    catch (TCLAP::ArgException &e)  // catch any exceptions
    {
        std::cerr << "error: " << e.error() << " for arg " << e.argId() << std::endl;
        rc = 1;
    }

    return rc;
}

int doList()
{
    std::cout << "List GNK devices" << std::endl;

    auto dev_list = enumDevices();

    for (uint32_t i = 0; i < dev_list.size(); i++)
    {
        std::cout << i << ": " << dev_list[i] << std::endl;
    }

    return 0;
}

int doGet()
{
    int rc = 0;

    std::cout << "Get hardware type" << std::endl;

    if (optDevice >= 0)
    {
        GNKSPI_HW hw = { sizeof(GNKSPI_HW) };
        USHORT r;
 
        rc = doIoctl(optDevice, IOCTL_GNKSPI_GET_HW, &hw, sizeof(hw));

        if (rc == ERROR_SUCCESS) {
            std::cout << " refresh: " << hw.refreshUnit << std::endl;
            std::cout << " hw type: " << hw.hwType << std::endl;
            std::cout << "led type: " << hw.ledType << std::endl;
            std::cout << " row cnt: " << hw.rowCount << std::endl;
            for (r = 0; r < hw.rowCount; r++) {
                std::cout << " led cnt: " << hw.ledCount[r] << std::endl;
            }
        }

    }

    return 0;
}

int doShow()
{
    int rc = 0;

    if (optFile.empty())
    {
        Err("File name is missing");
        return 1;
    }

    if (optVerbose)
        Msg("parse and start show %s", optFile.c_str());

    std::string jsonStr = readFile(optFile);
    if (jsonStr.empty())
    {
        Err("Error reading JSON file");
        return 1;
    }

    std::stringstream stream;
    rc = parseJson(jsonStr, stream);
    if (rc != 0)
    {
        Err("Input file format error");
        return 1;
    }

    std::string s = stream.str();
    uint16_t size = (uint16_t)(s.size());
    s[0] = (char)(size);
    s[1] = (char)(size >> 8);

    if (!optOutput.empty())
    {
        if (optVerbose)
            Msg("output to file %s", optOutput.c_str());

        std::ofstream output(optOutput, std::ios_base::binary);

        if (output.is_open())
            output << s;
    }

    if (optDevice >= 0)
    {
        if (optVerbose)
            Msg("output to device %d", optDevice);

        size_t size = s.size();
        uint8_t* buf = new uint8_t[size];

        memcpy(buf, s.c_str(), size);

        rc = doIoctl(optDevice, IOCTL_GNKSPI_SET_SHOW, buf, size);

        delete[] buf;
    }

    if (optProperty >= 0 && optProperty < sizeof(propertyList) / sizeof(propertyList[0]))
    {
        if (optVerbose)
            Msg("Save to persistent property %d", optProperty);

        size_t size = s.size();
        uint8_t* buf = new uint8_t[size];

        memcpy(buf, s.c_str(), size);

        rc = setStreamProperty(propertyList[optProperty], buf, size);

        delete[] buf;
    }

    return rc;
}

int doStop()
{
    int rc = 0;

    if (optVerbose)
        Msg("Stop show");

    rc = doIoctl(optDevice, IOCTL_GNKSPI_CLR_SHOW, NULL, 0);

    return rc;
}


int main(int argc, char **argv)
{
    int rc = cmdLineParser(argc, argv);

    if (rc != 0)
        return rc;

    if (!optCommand.compare("list"))
    {
        rc = doList();
    }
    if (!optCommand.compare("get"))
    {
        rc = doGet();
    }
    else if (!optCommand.compare("show"))
    {
        rc = doShow();
    }
    else if (!optCommand.compare("stop"))
    {
        rc = doStop();
    }

    return rc;
}
