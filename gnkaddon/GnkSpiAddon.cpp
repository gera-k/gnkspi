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

#include <node.h>
#include <windows.h>
#include <cfgmgr32.h>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>

#define DBG_MODULE "gnkaddon"
#define DBG_LEVEL DbgLevel
extern int DBG_LEVEL;

#include "public.h"
#include "trace.h"
#include "Utils.h"
#include "Device.h"

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

//int DBG_LEVEL = MSG_TR3;
int DBG_LEVEL = MSG_MSG;
bool optVerbose = false;

static const DEVPROPKEY *propertyList[] = {
    &gnkspiShow0, &gnkspiShow1, &gnkspiShow2, &gnkspiShow3, &gnkspiShow4,
    &gnkspiShow5, &gnkspiShow6, &gnkspiShow7, &gnkspiShow8, &gnkspiShow9
};

void Show(const FunctionCallbackInfo<Value>& args)
{
    Isolate* isolate = args.GetIsolate();
    int dev = -1;
    int prop = -1;

    if (args.Length() < 1) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong number of arguments")));
        return;
    }

    if (!args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong type of argument 0")));
        return;
    }

    if (args.Length() > 1)
    {
        if (!args[1]->IsInt32()) {
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8(isolate, "Wrong type of argument 1")));
            return;
        }

        dev = args[1]->Int32Value();
    }

    if (args.Length() > 2)
    {
        if (!args[1]->IsInt32()) {
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8(isolate, "Wrong type of argument 2")));
            return;
        }

        prop = args[2]->Int32Value();
    }

    String::Utf8Value arg0(args[0]->ToString());
    std::string str(*arg0);

    Tr1("show <%s>", str.c_str());

    std::stringstream stream;
    int rc = parseJson(str, stream);
    if (rc != 0)
    {
        isolate->ThrowException(Exception::SyntaxError(
            String::NewFromUtf8(isolate, "JSON syntax error")));
        return;
    }

    std::string s = stream.str();
    uint16_t size = (uint16_t)(s.size());
    s[0] = (char)(size);
    s[1] = (char)(size >> 8);

    if (dev >= 0)
    {
        size_t size = s.size();
        uint8_t* buf = new uint8_t[size];

        if (optVerbose)
            Msg("output %d bytes to device %d", size, dev);

        memcpy(buf, s.c_str(), size);

        rc = doIoctl(dev, IOCTL_GNKSPI_SET_SHOW, buf, size);

        delete[] buf;
    }

    if (prop >= 0 && prop < sizeof(propertyList) / sizeof(propertyList[0]))
    {
        if (optVerbose)
            Msg("Save to persistent property %d", prop);

        size_t size = s.size();
        uint8_t* buf = new uint8_t[size];

        memcpy(buf, s.c_str(), size);

        rc = setStreamProperty(propertyList[prop], buf, size);

        delete[] buf;
    }

    args.GetReturnValue().Set(rc);
}

void Stop(const FunctionCallbackInfo<Value>& args)
{
    Isolate* isolate = args.GetIsolate();
    int dev = -1;

    if (args.Length() < 1) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong number of arguments")));
        return;
    }

    if (!args[0]->IsInt32()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong type of argument 0")));
        return;
    }

    dev = args[1]->Int32Value();

    if (optVerbose)
        Msg("Stop show on device %d", dev);

    int rc = doIoctl(dev, IOCTL_GNKSPI_CLR_SHOW, NULL, 0);

    args.GetReturnValue().Set(rc);
}

void Init(Local<Object> exports) {
    NODE_SET_METHOD(exports, "show", Show);
    NODE_SET_METHOD(exports, "stop", Stop);
}

NODE_MODULE(addon, Init)
