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

#define DBG_MODULE "gnkdev"
#define DBG_LEVEL DbgLevel
extern int DBG_LEVEL;

#include "Public.h"
#include "Trace.h"
#include "Utils.h"
#include "Device.h"

using json = nlohmann::json;

extern bool optVerbose;

std::vector<std::string> enumDevices()
{
    std::vector<std::string> ret;
    CONFIGRET rc;
    ULONG BufferLen;
    PZZSTR Buffer = 0;
    CHAR* p;

    rc = CM_Get_Device_Interface_List_Size(
        &BufferLen,                             // _Out_    PULONG      pulLen,
        (LPGUID)&GUID_DEVINTERFACE_gnkspi,      // _In_     LPGUID      InterfaceClassGuid,
        NULL,                                   // _In_opt_ DEVINSTID_W pDeviceID,
        CM_GET_DEVICE_INTERFACE_LIST_PRESENT    // _In_     ULONG       ulFlags
        );

    if (rc != CR_SUCCESS)
    {
        Err("CM_Get_Device_Interface_List_Size error %d", rc);
        goto Ret;
    }

    Buffer = (PZZSTR)HeapAlloc(
        GetProcessHeap(),
        HEAP_ZERO_MEMORY,
        BufferLen);

    rc = CM_Get_Device_Interface_List(
        (LPGUID)&GUID_DEVINTERFACE_gnkspi,      // _In_     LPGUID      InterfaceClassGuid,
        NULL,                                   // _In_opt_ DEVINSTID_W pDeviceID,
        Buffer,                                 // _Out_    PWCHAR      Buffer,
        BufferLen,                              // _In_     ULONG       BufferLen,
        CM_GET_DEVICE_INTERFACE_LIST_PRESENT    // _In_     ULONG       ulFlags
        );

    if (rc != CR_SUCCESS)
    {
        Err("CM_Get_Device_Interface_List_Size error %d", rc);
        goto Ret;
    }

    p = Buffer;
    while (BufferLen > 0)
    {
        size_t len = strlen(p);
        if (len > 0)
        {
            ret.push_back(p);
            p += len + 1;
        }
        else
            break;
    }

Ret:
    if (Buffer != 0)
        HeapFree(GetProcessHeap(), 0, Buffer);

    return std::move(ret);
}

DWORD doIoctl(int device, ULONG ioctlCode, PVOID buf, size_t size)
{
    DWORD BytesReturned = 0;

    auto dev_list = enumDevices();

    if (device >= (int)dev_list.size()) {
        Err("Invalid device index %d", device);
        return BytesReturned;
    }

    const auto& dev = dev_list[device];

    if (optVerbose)
        Msg("%s", dev.c_str());

    HANDLE h = CreateFile(
        dev.c_str(),                    // _In_      LPCTSTR lpFileName,
        FILE_GENERIC_READ | FILE_GENERIC_WRITE, // _In_      DWORD dwDesiredAccess,
        FILE_SHARE_WRITE,               // _In_      DWORD dwShareMode,
        NULL,                           // _In_opt_  LPSECURITY_ATTRIBUTES lpSecurityAttributes,
        OPEN_EXISTING,                  // _In_      DWORD dwCreationDisposition,
        0,                              // _In_      DWORD dwFlagsAndAttributes,
        NULL                            // _In_opt_  HANDLE hTemplateFile
        );
    if (h == INVALID_HANDLE_VALUE) {
        Err("%s Open error: %s", dev.c_str(), GetLastErrorStr().c_str());
        return BytesReturned;
    }

    if (optVerbose && buf != NULL)
        TrH("Buffer", buf, size);

    BOOL ret = DeviceIoControl(
        h,                      // _In_        (HANDLE)       hDevice
        ioctlCode,              // _In_        (DWORD)        IoctlCode              // IOCTL code
        buf,                    // _In_        (LPVOID)       lpInBuffer,            // input buffer
        size,                   // _In_        (DWORD)        nInBufferSize,         // size of input buffer
        buf,                    // _Out_opt_   (LPVOID)       lpOutBuffer,           // output buffer
        size,                   // _In_        (DWORD)        nOutBufferSize,        // size of output buffer
        &BytesReturned,         // _Out_opt_   (LPDWORD)      lpBytesReturned,       // number of bytes returned
        NULL                    // _Inout_opt_ (LPOVERLAPPED) lpOverlapped );        // OVERLAPPED structure
        );
    if (!ret)
    {
        Err("%s Ioctl error %s", dev.c_str(), GetLastErrorStr().c_str());
    }

    CloseHandle(h);

    //    setStreamProperty(dev, buf, size);

    return BytesReturned;
}

int setStreamProperty(const DEVPROPKEY *propertyKey, void* stream, size_t size)
{
    CONFIGRET rc;
    DEVPROPTYPE type = DEVPROP_TYPE_BINARY;
    DEVINST DevInst;
    DEVINSTID DeviceID = "ACPI\\BCM2838\\0";

    rc = CM_Locate_DevNode(
        &DevInst,                   // _Out_    PDEVINST    pdnDevInst,
        DeviceID,                   // _In_opt_ DEVINSTID_W pDeviceID,
        CM_LOCATE_DEVNODE_NORMAL    // _In_     ULONG       ulFlags
        );
    if (optVerbose)
        Msg("CM_Locate_DevNode returned %d", rc);

    if (rc != CR_SUCCESS)
        Err("CM_Locate_DevNode error %d", rc);

    rc = CM_Set_DevNode_PropertyW(
        DevInst,                    // _In_  DEVINST dnDevInst,
        propertyKey,                // _In_  const DEVPROPKEY *PropertyKey,
        type,                       // _In_  DEVPROPTYPE PropertyType,
        (PBYTE)stream,              // _In_  const PBYTE PropertyBuffer,
        size,                       // _In_  ULONG PropertyBufferSize,
        0                           // _In_  ULONG ulFlags
        );
    if (optVerbose)
        Msg("CM_Set_DevNode_Property returned %d", rc);

    if (rc != CR_SUCCESS)
        Err("CM_Set_DevNode_Property error %d", rc);

    return 0;
}

int parseJson(const std::string& jsonStr, std::stringstream& s)
{
    try
    {
        json show = json::parse(jsonStr);
        json refresh;
        json frame;

        if (!show.is_object())
            throw std::exception("Outermost object not found");

        // reserve space for stream size
        s << 0 << 0;

        for (json::iterator it = show.begin(); it != show.end(); ++it)
        {
            if (!it.key().compare("refresh"))
            {
                refresh = it.value();
            }
            else if (!it.key().compare("frame"))
            {
                frame = it.value();
            }
            else
            {
                throw std::domain_error("Unexpected item " + it.key());
            }
        }

        int _refresh = 0;
        if (refresh.is_number())
            _refresh = static_cast<int>(refresh);
        else if (refresh.is_string())
            _refresh = atoi(static_cast<std::string>(refresh).c_str());
        
        if (_refresh == 0)
            throw std::exception("Refresh interval is missing or invalid");

        // refresh rate
        s << (char)_refresh;

        if (!frame.is_array())
            throw std::exception("Frame array is missing or invalid");

        // number of frames
        s << (char)frame.size();

        for (auto& f : frame)
        {
            if (!f.is_object())
                throw std::exception("Frame is not an object");

            std::string formatStr;
            GNKSPI_FRAME_FORMAT format = GNKSPI_FRAME_INVALID;
            json duration = 0;
            json repeat = 0;
            json row;
            char rowCount;

            for (json::iterator it = f.begin(); it != f.end(); ++it)
            {
                if (!it.key().compare("format"))
                {
                    formatStr = it.value().get<std::string>();
                }
                else if (!it.key().compare("duration"))
                {
                    duration = it.value();
                }
                else if (!it.key().compare("repeat"))
                {
                    repeat = it.value();
                }
                else if (!it.key().compare("row"))
                {
                    row = it.value();
                }
                else
                {
                    throw std::domain_error("Unexpected item " + it.key());
                }
            }

            if (!formatStr.compare("base"))
                format = GNKSPI_FRAME_BASE;
            else if (!formatStr.compare("update"))
                format = GNKSPI_FRAME_UPDATE;
            else if (!formatStr.compare("transition"))
                format = GNKSPI_FRAME_TRANSITION;
            else
                throw std::exception("Frame format is missing or invalid");

            int _duration = 0;
            if (duration.is_number())
                _duration = static_cast<int>(duration);
            else if (duration.is_string())
                _duration = atoi(static_cast<std::string>(duration).c_str());
            if (_duration == 0)
                throw std::exception("Frame duration is missing or invalid");

            int _repeat = 0;
            if (repeat.is_number())
                _repeat = static_cast<int>(repeat);
            else if (repeat.is_string())
                _repeat = atoi(static_cast<std::string>(repeat).c_str());
            if (_repeat == 0)
                throw std::exception("Frame repeat count is missing or invalid");

            if (!row.is_array())
                throw std::exception("Row array  is missing or invalid");

            rowCount = (char)row.size();

            // frame header
            s << (char)(_duration);
            s << (char)(_duration >> 8);

            s << (char)(_repeat);
            s << (char)(_repeat >> 8);

            s << (char)format;

            if (format == GNKSPI_FRAME_BASE)
                s << rowCount;

            for (auto& r : row)
            {
                if (r.is_array())
                {
                    char ledCount = (char)r.size();

                    if (format == GNKSPI_FRAME_BASE)
                        s << ledCount;

                    for (auto& l : r)
                    {
                        if (!l.is_string())
                            throw std::exception("Led value is missing or invalid");

                        char r, g, b;
                        if (!strToRgb(l.get<std::string>(), r, g, b))
                            throw std::exception("Led value is missing or invalid");

                        s << r;
                        s << g;
                        s << b;
                    }
                }
                else if (r.is_object())
                {
                    std::vector<std::string> led;

                    for (json::iterator it = r.begin(); it != r.end(); ++it)
                    {
                        char r, g, b;
                        size_t fr, to;

                        if (!strToRange(it.key(), fr, to))
                            throw std::exception("Led range is missing or invalid");

                        if (!strToRgb(it.value(), r, g, b))
                            throw std::exception("Led value is missing or invalid");

                        if (led.size() < to + 1)
                            led.resize(to + 1);

                        for (size_t i = fr; i <= to; i++)
                            led[i] = it.value().get<std::string>();
                    }

                    char ledCount = (char)led.size();

                    if (format == GNKSPI_FRAME_BASE)
                        s << ledCount;

                    for (auto& l : led)
                    {
                        char r, g, b;

                        if (l.empty())
                        {
                            r = g = b = 0;
                        }
                        else
                        {
                            strToRgb(l, r, g, b);
                        }

                        s << r;
                        s << g;
                        s << b;
                    }
                }
                else
                    throw std::exception("Led definition is missing or invalid");
            }
        }
    }
    catch (std::exception e)
    {
        Err("%s", e.what());
        return 1;
    }

    return 0;
}
