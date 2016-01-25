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


/*++

Module Name:

    device.c - Device handling events for example driver.

Abstract:

   This file contains the device entry points and callbacks.
    
Environment:

    Kernel-mode Driver Framework

--*/

#define WPP_BIT_TRACE_FLAG WPP_BIT_TRACE_DEVICE
#include "driver.h"
#include "device.tmh"

#ifdef ALLOC_PRAGMA
#pragma alloc_text (PAGE, gkspiCreateDevice)
#endif

NTSTATUS EvtDevicePrepareHardware(
    _In_ WDFDEVICE    Device,
    _In_ WDFCMRESLIST ResourcesRaw,
    _In_ WDFCMRESLIST ResourcesTranslated
    )
{
    NTSTATUS status = STATUS_SUCCESS;
    PDEVICE_CONTEXT deviceContext;
    ULONG  i;

    UNREFERENCED_PARAMETER(ResourcesRaw);

    Tr1(" enter");

    deviceContext = DeviceGetContext(Device);

    for (i = 0; i < WdfCmResourceListGetCount(ResourcesTranslated); i++) 
    {
        PCM_PARTIAL_RESOURCE_DESCRIPTOR  desc;

        desc = WdfCmResourceListGetDescriptor(
            ResourcesTranslated,
            i
            );

        switch (desc->Type) {

        case CmResourceTypeMemory:
            Tr2("Memory start 0x%08X  size 0x%X", desc->u.Memory.Start.LowPart, desc->u.Memory.Length);

            if (deviceContext->regVirt == 0)
            {
                deviceContext->regVirt = (PULONG)MmMapIoSpace(
                    desc->u.Memory.Start,       // _In_ PHYSICAL_ADDRESS    PhysicalAddress,
                    desc->u.Memory.Length,      // _In_ SIZE_T              NumberOfBytes,
                    MmNonCached                 // _In_ MEMORY_CACHING_TYPE CacheType
                    );

                if (deviceContext->regVirt == 0)
                {
                    status = STATUS_INSUFFICIENT_RESOURCES;
                    break;
                }

                deviceContext->regSize = desc->u.Memory.Length;
            }
            break;

        case CmResourceTypeInterrupt:
            Tr2("Interrupt vector %d  level %d", desc->u.Interrupt.Vector, desc->u.Interrupt.Level);
            break;

        default:
            Tr2("Unknown resource type %d", desc->Type);
            break;
        }
    }

    if (NT_SUCCESS(status))
    {
        PHYSICAL_ADDRESS a = { GPIO_REG_BASE };
        deviceContext->gpioVirt = (PULONG)MmMapIoSpace(
            a,                          // _In_ PHYSICAL_ADDRESS    PhysicalAddress,
            GPIO_REG_SIZE,              // _In_ SIZE_T              NumberOfBytes,
            MmNonCached                 // _In_ MEMORY_CACHING_TYPE CacheType
            );

        if (deviceContext->gpioVirt == 0)
        {
            status = STATUS_INSUFFICIENT_RESOURCES;
        }

        deviceContext->gpioSize = GPIO_REG_SIZE;
    }

    if (!NT_SUCCESS(status))
    {
        if (deviceContext->gpioVirt != 0)
        {
            MmUnmapIoSpace(deviceContext->gpioVirt, deviceContext->gpioSize);
            deviceContext->gpioVirt = 0;
        }

        if (deviceContext->regVirt != 0)
        {
            MmUnmapIoSpace(deviceContext->regVirt, deviceContext->regSize);
            deviceContext->regVirt = 0;
        }
    }

    Tr1("return 0x%08X", status);

    return status;
}

NTSTATUS EvtDeviceReleaseHardware(
    _In_  WDFDEVICE Device,
    _In_  WDFCMRESLIST ResourcesTranslated
    )
{
    PDEVICE_CONTEXT deviceContext;
    NTSTATUS status = STATUS_SUCCESS;

    UNREFERENCED_PARAMETER(ResourcesTranslated);

    deviceContext = DeviceGetContext(Device);

    Tr1("enter");

    if (deviceContext->gpioVirt != 0)
    {
        MmUnmapIoSpace(deviceContext->gpioVirt, deviceContext->gpioSize);
        deviceContext->gpioVirt = 0;
    }

    if (deviceContext->regVirt != 0)
    {
        MmUnmapIoSpace(deviceContext->regVirt, deviceContext->regSize);
        deviceContext->regVirt = 0;
    }

    Tr1("return 0x%08X", status);

    return status;
}

NTSTATUS EvtDeviceD0Entry(
    _In_ WDFDEVICE              Device,
    _In_ WDF_POWER_DEVICE_STATE PreviousState
    )
{
    NTSTATUS status = STATUS_SUCCESS;
    PDEVICE_CONTEXT deviceContext;
    WDF_DEVICE_PROPERTY_DATA DeviceProperty;
    WDFMEMORY propertyData;
    DEVPROPTYPE propertyType;
    ULONG* b;
    ULONG r;

    UNREFERENCED_PARAMETER(PreviousState);

    deviceContext = DeviceGetContext(Device);

    Tr1("enter");

    if (deviceContext->regVirt == 0)
    {
        status = STATUS_INSUFFICIENT_RESOURCES;
        goto Ret;
    }

    b = deviceContext->regVirt;

    Tr2("CS   %08X", *R_CS(b));
    Tr2("FIFO %08X", *R_FIFO(b));
    Tr2("CLK  %08X", *R_CLK(b));
    Tr2("DLEN %08X", *R_DLEN(b));
    Tr2("LTOH %08X", *R_LTOH(b));
    Tr2("DC   %08X", *R_DC(b));

    *R_CLK(b) = 0x20;

    b = deviceContext->gpioVirt;
    Tr2("GPFSEL0   %08X", *GPFSEL0(b));
    Tr2("GPFSEL1   %08X", *GPFSEL1(b));
    Tr2("GPFSEL2   %08X", *GPFSEL2(b));
    Tr2("GPFSEL3   %08X", *GPFSEL3(b));
    Tr2("GPFSEL4   %08X", *GPFSEL4(b));
    Tr2("GPFSEL5   %08X", *GPFSEL5(b));

    //  set GPIO 22,23,24,25 to output
    //      GPIO 27 to input
    r = *GPFSEL2(b);
    r &= (7 << 6) | (7 << 9) | (7 << 12) | (7 << 15) | (7 << 21);
    r |= (1 << 6) | (1 << 9) | (1 << 12) | (1 << 15) | (0 << 21);
    *GPFSEL2(b) = r;

    Msg("GPFSEL2   %08X", *GPFSEL2(b));

    *GPSET0(b) = (1 << 22) | (1 << 23) | (1 << 24) | (1 << 25) | (1 << 27);

    // detect hardware type
    gnkspiDetectHardware(deviceContext);

    // read device attributes
    WDF_DEVICE_PROPERTY_DATA_INIT(&DeviceProperty, &gnkspiShow0);
    status = WdfDeviceAllocAndQueryPropertyEx(
        Device,                         // [in]           WDFDEVICE                 Device,
        &DeviceProperty,                // [in]           PWDF_DEVICE_PROPERTY_DATA DeviceProperty,
        NonPagedPool,                   // [in]           POOL_TYPE                 PoolType,
        WDF_NO_OBJECT_ATTRIBUTES,       // [in, optional] PWDF_OBJECT_ATTRIBUTES    PropertyMemoryAttributes,
        &propertyData,                  // [out]          WDFMEMORY                 *PropertyMemory,
        &propertyType                   // [out]          PDEVPROPTYPE              Type
        );
    if (!NT_SUCCESS(status))
    {
        Err("WdfDeviceAllocAndQueryPropertyEx status 0x%08X", status);
        status = STATUS_SUCCESS;
    }
    else
    {
        size_t  Size;
        WdfMemoryGetBuffer(propertyData, &Size);
        Tr1("Proprty type 0x%X  Size %d", propertyType, Size);

        deviceContext->showStream = propertyData;

        // parse stream and start show
        status = gnkspiSetShowStream(deviceContext);
        if (!NT_SUCCESS(status))
        {
            Err("SetShowStream failed; status 0x%X", status);
            WdfObjectDelete(deviceContext->showStream);
            deviceContext->showStream = WDF_NO_HANDLE;
        }
        else
        {
            gnkspiShow0Start(deviceContext);
        }
    }

Ret:
    Tr1("return 0x%08X", status);

    return status;
}

NTSTATUS EvtDeviceD0Exit(
    _In_  WDFDEVICE Device,
    _In_  WDF_POWER_DEVICE_STATE TargetState
    )
{
    NTSTATUS status = STATUS_SUCCESS;
    PDEVICE_CONTEXT deviceContext;

    UNREFERENCED_PARAMETER(TargetState);

    deviceContext = DeviceGetContext(Device);

    Tr1("enter");

    gnkspiShow0Stop(deviceContext, TRUE);
    gnkspiClear(deviceContext);

    if (deviceContext->showStream != WDF_NO_HANDLE)
    {
        WdfObjectDelete(deviceContext->showStream);
        deviceContext->showStream = WDF_NO_HANDLE;
    }

    return status;
}


NTSTATUS
gnkspiDetectHardware(
    _In_ PDEVICE_CONTEXT deviceContext
    )
{
    NTSTATUS status = STATUS_SUCCESS;
    ULONG* b = deviceContext->gpioVirt;
    PGNKSPI_HW hw = &deviceContext->hw;
    int i;

    // detect hardware type
    hw->size = sizeof(deviceContext->hw);
    hw->refreshUnit = GNKSPL_REFRESH_UNIT;

    hw->hwType = GNKSPI_HW_UNKNOWN;

    *GPSET0(b) = (1 << 22) | (1 << 23) | (1 << 24) | (1 << 25);

    if ((*GPLEV0(b) & (1 << 27)) == 0)
    {
        Err("Unknown hardware - Invalid state of GPIO27 - GPLEV0 0x%08X", *GPLEV0(b));
        status = STATUS_INVALID_DEVICE_STATE;
    }
    else
    {
        if (hw->hwType == GNKSPI_HW_UNKNOWN)
        {
            // if GPIO27 == GPIO22 => LightStar
            for (i = 0; i < 100; i++)
                *GPCLR0(b) = (1 << 22);

            if (((*GPLEV0(b) & (1 << 27)) == 0))
            {
                Msg("LightStar hardware detected");
                GNKSPI_HW_CONFIG_LIGHTSTAR(hw);
            }

            *GPSET0(b) = (1 << 22);
        }

        if (hw->hwType == GNKSPI_HW_UNKNOWN)
        {
            // if GPIO27 == GPIO23 => SnowFlake
            for (i = 0; i < 100; i++)
                *GPCLR0(b) = (1 << 23);

            if (((*GPLEV0(b) & (1 << 27)) == 0))
            {
                Msg("LedPanel hardware detected");
                GNKSPI_HW_CONFIG_LEDPANEL(hw);
            }

            *GPSET0(b) = (1 << 23);
        }
    }

    Msg(" hw type: %d", hw->hwType);
    Msg("led type: %d", hw->ledType);
    Msg(" row cnt: %d", hw->rowCount);

    if (hw->hwType == GNKSPI_HW_UNKNOWN)
    {
        *GPCLR0(b) = (1 << 22) | (1 << 23) | (1 << 24) | (1 << 25);
        Err("Unknown hardware - GPLEV0 0x%08X", *GPLEV0(b));

        status = STATUS_UNSUCCESSFUL;
    }

    *GPSET0(b) = (1 << 22) | (1 << 23) | (1 << 24) | (1 << 25);

    return status;
}

NTSTATUS
gkspiCreateDevice(
    _Inout_ PWDFDEVICE_INIT DeviceInit
    )
/*++

Routine Description:

    Worker routine called to create a device and its software resources.

Arguments:

    DeviceInit - Pointer to an opaque init structure. Memory for this
                    structure will be freed by the framework when the WdfDeviceCreate
                    succeeds. So don't access the structure after that point.

Return Value:

    NTSTATUS

--*/
{
    NTSTATUS status;
    WDF_OBJECT_ATTRIBUTES   deviceAttributes;
    WDF_PNPPOWER_EVENT_CALLBACKS  pnpPowerCallbacks;
    PDEVICE_CONTEXT deviceContext;
    WDFDEVICE device;
    WDF_TIMER_CONFIG timerConfig;
    WDF_OBJECT_ATTRIBUTES timerAttributes;

    PAGED_CODE();

    Tr1("enter");

    WDF_OBJECT_ATTRIBUTES_INIT_CONTEXT_TYPE(&deviceAttributes, DEVICE_CONTEXT);

    WDF_PNPPOWER_EVENT_CALLBACKS_INIT(&pnpPowerCallbacks);
    pnpPowerCallbacks.EvtDevicePrepareHardware = EvtDevicePrepareHardware;
    pnpPowerCallbacks.EvtDeviceReleaseHardware = EvtDeviceReleaseHardware;
    pnpPowerCallbacks.EvtDeviceD0Entry = EvtDeviceD0Entry;
    pnpPowerCallbacks.EvtDeviceD0Exit = EvtDeviceD0Exit;
    WdfDeviceInitSetPnpPowerEventCallbacks(DeviceInit, &pnpPowerCallbacks);

    status = WdfDeviceCreate(&DeviceInit, &deviceAttributes, &device);

    if (!NT_SUCCESS(status))
    {
        Err("WdfDeviceCreate status 0x%08X\n", status);
        goto RetErr;
    }

    deviceContext = DeviceGetContext(device);

    // Initialize the context.
    deviceContext->regVirt = 0;
    deviceContext->currFrame = 0;

    // Create a device interface
    status = WdfDeviceCreateDeviceInterface(
        device,
        &GUID_DEVINTERFACE_gnkspi,
        NULL // ReferenceString
        );
    if (!NT_SUCCESS(status))
    {
        Err("WdfDeviceCreateDeviceInterface status 0x%08X\n", status);
        goto RetErr;
    }
    
    // Initialize the I/O Package and any Queues
    status = gkspiQueueInitialize(device);
    if (!NT_SUCCESS(status))
    {
        Err("QueueInitialize status 0x%08X\n", status);
        goto RetErr;
    }

    KeInitializeSpinLock(&deviceContext->frameLock);

    // Create timer for refresh task
    WDF_TIMER_CONFIG_INIT_PERIODIC(&timerConfig, gnkspiRefresh, GNKSPL_REFRESH_UNIT);
//            timerConfig.AutomaticSerialization = TRUE;
//            timerConfig.UseHighResolutionTimer = WdfTrue;
    WDF_OBJECT_ATTRIBUTES_INIT(&timerAttributes);
    timerAttributes.ParentObject = device;
    status = WdfTimerCreate(
        &timerConfig,                   // [in]  PWDF_TIMER_CONFIG      Config,
        &timerAttributes,               // [in]  PWDF_OBJECT_ATTRIBUTES Attributes,
        &deviceContext->refreshTimer    // [out] WDFTIMER               *Timer
        );
    if (!NT_SUCCESS(status))
    {
        Err("WdfTimerCreate status 0x%08X\n", status);
        goto RetErr;
    }

RetErr:
    Tr1("return 0x%08X", status);
    return status;
}

NTSTATUS
gnkspiSetShowStream(
    _In_ PDEVICE_CONTEXT deviceContext
    )
{
    NTSTATUS status = STATUS_INVALID_PARAMETER;
    BYTE *p, *b;        // current position in the stream
    size_t l;       // remaining stream length
    USHORT length;
    BYTE refresh;
    BYTE step, stepCount;

    Tr1("");

    b = p = (BYTE*)WdfMemoryGetBuffer(deviceContext->showStream, &l);

//    TrH("Buffer", p, l);

    //      - total size - 2 bytes LE
    //      - refresh period - 1 byte (in GNKSPL_REFRESH_UNIT)
    //      - step count - 1 byte (from 1 to GNKSPL_MAX_STEP_COUNT)

    if (l < 4)
    {
        Err("Stream (length %d) is too short - incomplete stream header", l);
        goto RetErr;
    }

    RtlRetrieveUshort(&length, p);
    p += 2;

    refresh = *p++;
    stepCount = *p++;

    if (length != l )
    {
        Err("Stream length %d does not match buffer length %d", length, l);
        goto RetErr;
    }

    if (stepCount > GNKSPL_MAX_STEP_COUNT || stepCount == 0)
    {
        Err("Step count %d is invalid, allowed 1..%d", stepCount, GNKSPL_MAX_STEP_COUNT);
        goto RetErr;
    }

    Tr1("Show length: %d", length);
    Tr1("Refresh period: %d", refresh);
    Tr1("Step count: %d", stepCount);

    l -= 4;

    deviceContext->showRefreshPeriod = refresh;
    Tr1("showRefreshPeriod = %d", deviceContext->showRefreshPeriod);

    deviceContext->showStepCount = stepCount;
    Tr1("showStepCount = %d", deviceContext->showStepCount);

    ULONG byteCount = 0;     // total data bytes in last FRAME

    for (step = 0; step < stepCount; step++)
    {
        BYTE format;
        USHORT duration;
        USHORT repeat;
        BYTE row, rowCount;
        BYTE ledCount;

        //          - step duration - 2 bytes
        //          - step repeat count - 2 bytes
        //          - step format - 1 byte (GNKSPI_SHOW_INVALID+1..GNKSPI_SHOW_MAX_FORMAT-1)

        if (l < 5)
        {
            Err("Stream is too short - incomplete header of step %d", step);
            goto RetErr;
        }

        RtlRetrieveUshort(&duration, p);
        p += 2;
        l -= 2;

        RtlRetrieveUshort(&repeat, p);
        p += 2;
        l -= 2;

        format = *p++;
        l--;

        if (format > (GNKSPI_FRAME_MAX_FORMAT - 1) || format < (GNKSPI_FRAME_INVALID + 1))
        {
            Err("Invalid format %d of step %d", format, step);
            goto RetErr;
        }

//        Tr1("Step %d:", step);
//        Tr1("  Duration: %d", duration);
//        Tr1("  Repeat count: %d", repeat);

        deviceContext->showStep[step].duration = duration;
        Tr1("showStep[%d].duration = %d", step, deviceContext->showStep[step].duration);
        deviceContext->showStep[step].repeat = repeat;
        Tr1("showStep[%d].repeat = %d", step, deviceContext->showStep[step].repeat);
        deviceContext->showStep[step].format = format;
        Tr1("showStep[%d].format = %d", step, deviceContext->showStep[step].format);
        deviceContext->showStep[step].offset = (USHORT)(p - b);
        Tr1("showStep[%d].offset = %d", step, deviceContext->showStep[step].offset);

        switch (format)
        {
        case GNKSPI_FRAME_BASE:
        {
            //                  - row count - 1 byte (1..GNKSPL_MAX_ROW_COUNT)
            //                  - row 0 data:
            //                      - led count - 1 byte (1..GNKSPL_MAX_LED_COUNT) 
            //                      - led 0 value - 3bytes BB RR GG

            byteCount = 0;

            if (l < 5)
            {
                Err("Stream is too short - no row count on step %d", step);
                goto RetErr;
            }

            rowCount = *p++;
            l--;

            if (rowCount > GNKSPL_MAX_ROW_COUNT || rowCount == 0)
            {
                Err("Row count %d on step %d is invalid, allowed 1..%d", rowCount, step, GNKSPL_MAX_ROW_COUNT);
                goto RetErr;
            }

            Tr1("  Format: FRAME");
            Tr1("  Row count: %d", rowCount);

            for (row = 0; row < rowCount; row++)
            {
                if (l < 1)
                {
                    Err("Stream is too short - no led count in row %d on step %d", row, step);
                    goto RetErr;
                }

                ledCount = *p++;
                l--;

                if (ledCount > GNKSPL_MAX_LED_COUNT || ledCount == 0)
                {
                    Err("Led count %d in row %d on step %d is invalid, allowed 1..%d", ledCount, row, step, GNKSPL_MAX_LED_COUNT);
                    goto RetErr;
                }

                Tr1("  Row %d  Led count: %d", row, ledCount);

                if (l < (size_t)(ledCount * 3))
                {
                    Err("Stream is too short - incomplete led data in row %d on step %d", row, step);
                    goto RetErr;
                }

                p += ledCount * 3;
                l -= ledCount * 3;

                byteCount += ledCount * 3;
            }

            break;
        }

        case GNKSPI_FRAME_UPDATE:
        {
            Tr1("  Format: UPDATE  byteCount %d", byteCount);

            if (l < byteCount)
            {
                Err("Stream is too short - %d bytes left, %d expected", l, byteCount);
                goto RetErr;
            }

            p += byteCount;
            l -= byteCount;

            break;
        }

        case GNKSPI_FRAME_TRANSITION:
        {
            Tr1("  Format: TRANSITION  byteCount %d", byteCount);

            if (l < byteCount)
            {
                Err("Stream is too short - %d bytes left, %d expected", l, byteCount);
                goto RetErr;
            }

            p += byteCount;
            l -= byteCount;

            break;
        }
        }
    }

    if (l != 0)
    {
        Err("Extra data (%d bytes) at the end of the stream", l);
        goto RetErr;
    }

    status = STATUS_SUCCESS;

RetErr:
    return status;
}

VOID 
gnkspiShow0Start(
    _In_ PDEVICE_CONTEXT deviceContext
    )
{
    Tr1("");

    // reset current step
    deviceContext->step = 0;
    deviceContext->stepDuration = 0;
    deviceContext->stepRepeat = 0;

    // calculate next frame
    gnkspiShow0Next(deviceContext);

    WdfTimerStart(deviceContext->refreshTimer, WDF_REL_TIMEOUT_IN_MS(GNKSPL_REFRESH_UNIT));
}

static inline SHORT 
interpolate(SHORT range, USHORT position, USHORT count)
{
    return (SHORT)(range * position / count);
}

VOID
gnkspiShow0Next(
    _In_ PDEVICE_CONTEXT deviceContext
    )
{
    Tr3("step %d  duration %d  repeat %d", deviceContext->step, deviceContext->stepDuration, deviceContext->stepRepeat);

    // select current step
    PSHOW_STEP step = &deviceContext->showStep[deviceContext->step];

    // if duration counter not yet expired, do not recalculate 
    if (deviceContext->stepDuration > 0 && deviceContext->stepDuration++ < step->duration)
        return;

    // reset duration counter
    deviceContext->stepDuration = 1;

    // if repeat counter expired, go to next step
    if (deviceContext->stepRepeat >= step->repeat)
    {
        deviceContext->stepRepeat = 0;

        deviceContext->step++;
        if (deviceContext->step >= deviceContext->showStepCount)
            deviceContext->step = 0;

        step = &deviceContext->showStep[deviceContext->step];
    }
    
    // update repeat counter
    deviceContext->stepRepeat++;

    // recalculate frame
    ULONG* newFrame = NULL;

    // locate step data
    BYTE* p = (BYTE*)WdfMemoryGetBuffer(deviceContext->showStream, NULL) + step->offset;

    BYTE rowCount = 0;
    BYTE ledCount[GNKSPL_MAX_ROW_COUNT];

    switch (step->format)
    {
    case GNKSPI_FRAME_BASE:
    {
        newFrame = deviceContext->showFrame1;

        rowCount = *p++;

        Tr3("FRAME_BASE  row count %d  repeat %d", rowCount, deviceContext->stepRepeat);

        for (BYTE row = 0; row < rowCount; row++)
        {
            ULONG* r = newFrame + row * GNKSPL_MAX_LED_COUNT;
            ledCount[row] = *p++;

            for (BYTE led = 0; led < ledCount[row]; led++)
            {
                BYTE R = *p++;
                BYTE G = *p++;
                BYTE B = *p++;

                r[led] = ((ULONG)G << 16) | ((ULONG)R << 8) | ((ULONG)B << 0);
            }
        }

        break;
    }

    case GNKSPI_FRAME_UPDATE:
    {
        ULONG* oldFrame = deviceContext->currFrame;

        if (oldFrame == NULL)
            break;
        if (oldFrame == deviceContext->showFrame2)
            newFrame = deviceContext->showFrame2;
        else
            newFrame = deviceContext->showFrame1;

        rowCount = deviceContext->currRowCount;
        RtlCopyMemory(ledCount, deviceContext->currLedCount, sizeof(ledCount));

        Tr3("FRAME_UPDATE  row count %d", rowCount);

        for (BYTE row = 0; row < rowCount; row++)
        {
            ULONG* lr = oldFrame + row * GNKSPL_MAX_LED_COUNT;
            ULONG* nr = newFrame + row * GNKSPL_MAX_LED_COUNT;

            for (BYTE led = 0; led < ledCount[row]; led++)
            {
                ULONG l = lr[led];

                BYTE R = (l >> 8) & 0xFF;
                BYTE G = (l >> 16) & 0xFF;
                BYTE B = (l >> 0) & 0xFF;

                R += (CHAR)(*p++);
                G += (CHAR)(*p++);
                B += (CHAR)(*p++);

                nr[led] = ((ULONG)G << 16) | ((ULONG)R << 8) | ((ULONG)B << 0);
            }
        }

        break;
    }

    case GNKSPI_FRAME_TRANSITION:
    {
        ULONG* baseFrame = deviceContext->showFrame1;
        newFrame = deviceContext->showFrame2;

        rowCount = deviceContext->currRowCount;
        RtlCopyMemory(ledCount, deviceContext->currLedCount, sizeof(ledCount));

        Tr3("FRAME_TRANSITION  row count %d  repeat %d", rowCount, deviceContext->stepRepeat);

        for (BYTE row = 0; row < rowCount; row++)
        {
            ULONG* br = baseFrame + row * GNKSPL_MAX_LED_COUNT;
            ULONG* nr = newFrame + row * GNKSPL_MAX_LED_COUNT;

            for (BYTE led = 0; led < ledCount[row]; led++)
            {
                ULONG l = br[led];

                SHORT R = (l >> 8) & 0xFF;
                SHORT G = (l >> 16) & 0xFF;
                SHORT B = (l >> 0) & 0xFF;

                SHORT nR = *p++;
                SHORT nG = *p++;
                SHORT nB = *p++;

                R += interpolate(nR - R, deviceContext->stepRepeat, step->repeat);
                G += interpolate(nG - G, deviceContext->stepRepeat, step->repeat);
                B += interpolate(nB - B, deviceContext->stepRepeat, step->repeat);

                nr[led] = ((ULONG)(G & 0xFF) << 16) | ((ULONG)(R & 0xFF) << 8) | ((ULONG)(B & 0xFF) << 0);
            }
        }

        // on last step copy transition result into base frame
        if (deviceContext->stepRepeat == step->repeat)
            memcpy(baseFrame, newFrame, GNKSPL_MAX_ROW_COUNT * GNKSPL_MAX_LED_COUNT * sizeof(ULONG));

        break;
    }

    }

    // set frame to show 
    KIRQL Irql;
    KeAcquireSpinLock(&deviceContext->frameLock, &Irql);
    deviceContext->currFrame = newFrame;
    deviceContext->currRowCount = rowCount;
    RtlCopyMemory(deviceContext->currLedCount, ledCount, sizeof(ledCount));
    KeReleaseSpinLock(&deviceContext->frameLock, Irql);
}

VOID
gnkspiShow0Stop(
    _In_ PDEVICE_CONTEXT deviceContext,
    BOOLEAN Wait
    )
{
    KIRQL Irql1;

    Tr1("");

    WdfTimerStop(deviceContext->refreshTimer, Wait);

    KeAcquireSpinLock(&deviceContext->frameLock, &Irql1);
    deviceContext->currFrame = NULL;

    KeReleaseSpinLock(&deviceContext->frameLock, Irql1);
}


VOID
gnkspiRefresh(
    _In_  WDFTIMER Timer
    )
{
    WDFDEVICE Device = (WDFDEVICE)WdfTimerGetParentObject(Timer);
    PDEVICE_CONTEXT deviceContext = DeviceGetContext(Device);
    BOOLEAN stop = TRUE;

    switch (deviceContext->hw.ledType)
    {
    case GNKSPI_LED_NEOPIXEL:
        stop = gnkspiRefreshNeopixel(deviceContext);
        break;
    case GNKSPI_LED_DOTSTAR:
        stop = gnkspiRefreshDotstar(deviceContext);
        break;
    }

    if (stop)
    {
        gnkspiShow0Stop(deviceContext, FALSE);
    }
    else if (++deviceContext->currRefresh >= deviceContext->showRefreshPeriod)
    {
        deviceContext->currRefresh = 0;
        gnkspiShow0Next(deviceContext);
    }
}


VOID
gnkspiClear(
    _In_  PDEVICE_CONTEXT deviceContext
    )
{
    switch (deviceContext->hw.ledType)
    {
    case GNKSPI_LED_NEOPIXEL:
        gnkspiClearNeopixel(deviceContext);
        break;
    case GNKSPI_LED_DOTSTAR:
        gnkspiClearDotstar(deviceContext);
        break;
    }
}


BOOLEAN
gnkspiRefreshNeopixel(
    _In_  PDEVICE_CONTEXT deviceContext
    )
{
    KIRQL Irql1, Irql2;
    ULONG* frame;
    BYTE ledCount;
    BYTE loopCount;
    ULONG* b = deviceContext->regVirt;
    ULONG* g = deviceContext->gpioVirt;
    int t1 = 0;
    LONG ri, li = 0, bi = 0;    // row, led, bit indices
    volatile ULONG* fifo = R_FIFO(b);
    volatile ULONG* cs = R_CS(b);

    Tr4("");

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;
    *cs = CS_TA | CS_CLEAR_TX | CS_CLEAR_RX;

    for (ri = 0; ri < deviceContext->currRowCount; ri++)
    {
        KeAcquireSpinLock(&deviceContext->frameLock, &Irql1);

        frame = deviceContext->currFrame;
        ledCount = deviceContext->currLedCount[ri];
        loopCount = ledCount + 4;

        if (frame == NULL)
        {
            KeReleaseSpinLock(&deviceContext->frameLock, Irql1);
            return TRUE;
        }

        ULONG* row = frame + ri * GNKSPL_MAX_LED_COUNT;
        ULONG gpio = 1 << (22 + ri);

        // select row in hardware
        *GPCLR0(g) = gpio;

        Irql2 = KeRaiseIrqlToSynchLevel();

        for (li = 0; li < loopCount; li++)
        {
            ULONG led = row[li];

            for (bi = 23; bi >= 0; bi--)
            {
                BYTE v = (led & (1 << bi)) ? 0xFC : 0xC0;

                *fifo = li < ledCount ? v : 0;

                t1 = 100000;
                while ((!(*cs & CS_TXD)) && (--t1));
                if (t1 == 0)
                    break;
            }

            *cs = CS_TA | CS_CLEAR_RX;
        }

        KeLowerIrql(Irql2);

        KeReleaseSpinLock(&deviceContext->frameLock, Irql1);

        *GPSET0(g) = gpio;

        if (t1 == 0)
            Err("TXD hang  bi %d  CS %08X", bi, *R_CS(b));
    }

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;

    return t1 == 0;
}

VOID
gnkspiClearNeopixel(
    _In_  PDEVICE_CONTEXT deviceContext
    )
{
    KIRQL Irql1, Irql2;
    LONG ledCount;
    LONG loopCount;
    ULONG* b = deviceContext->regVirt;
    ULONG* g = deviceContext->gpioVirt;
    int t1 = 0;
    LONG li = 0, bi = 0;
    volatile ULONG* fifo = R_FIFO(b);
    volatile ULONG* cs = R_CS(b);

    Tr4("");

    KeAcquireSpinLock(&deviceContext->frameLock, &Irql1);

    ledCount = GNKSPL_MAX_LED_COUNT;
    loopCount = ledCount + 4;

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;

    ULONG gpio = (1 << 22) | (1 << 23) | (1 << 24) | (1 << 25);

    // select row in hardware
    *GPCLR0(g) = gpio;

    *cs = CS_TA | CS_CLEAR_TX | CS_CLEAR_RX;

    Irql2 = KeRaiseIrqlToSynchLevel();

    for (li = 0; li < loopCount; li++)
    {
        for (bi = 23; bi >= 0; bi--)
        {
            *fifo = li < ledCount ? 0xC0 : 0;

            t1 = 100000;
            while ((!(*cs & CS_TXD)) && (--t1));
            if (t1 == 0)
                break;
        }

        *cs = CS_TA | CS_CLEAR_RX;
    }

    KeLowerIrql(Irql2);

    KeReleaseSpinLock(&deviceContext->frameLock, Irql1);

    *GPSET0(g) = gpio;

    if (t1 == 0)
        Err("TXD hang  bi %d  CS %08X", bi, *R_CS(b));

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;
}

BOOLEAN
gnkspiRefreshDotstar(
    _In_  PDEVICE_CONTEXT deviceContext
    )
{
    KIRQL Irql1;
    ULONG* frame;
    BYTE ledCount;
    ULONG* b = deviceContext->regVirt;
    ULONG* g = deviceContext->gpioVirt;
    int t1 = 0, t2 = 0;
    LONG ri, li, bi = 0;    // row, led, byte indices
    volatile ULONG* fifo = R_FIFO(b);
    volatile ULONG* cs = R_CS(b);

    Tr4("");

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;
    *cs = CS_TA | CS_CLEAR_TX | CS_CLEAR_RX;

    // enable data gate
    *GPCLR0(g) = (1 << 22);

    for (ri = 0; ri < deviceContext->currRowCount; ri++)
    {
        KeAcquireSpinLock(&deviceContext->frameLock, &Irql1);

        frame = deviceContext->currFrame;
        ledCount = deviceContext->currLedCount[ri];

        if (frame == NULL)
        {
            KeReleaseSpinLock(&deviceContext->frameLock, Irql1);
            return TRUE;
        }

        ULONG* row = frame + ri * GNKSPL_MAX_LED_COUNT;
        ULONG gpio = 1 << (23 + ri);

        // enable clock gate
        *GPCLR0(g) = gpio;

        // start frame
        for (bi = 0; bi < 4; bi++)
        {
            *fifo = 0;

            t1 = 100000;
            while ((!(*cs & CS_TXD)) && (--t1));
            if (t1 == 0)
                break;
        }

        *cs = CS_TA | CS_CLEAR_RX;

        // LED frames
        if (t1 > 0) for (li = 0; li < ledCount; li++)
        {
            ULONG led = row[li];
            BYTE d[4] = { 0xFF,
                (led >> 0) & 0xFF,
                (led >> 16) & 0xFF,
                (led >> 8) & 0xFF
            };

            for (bi = 0; bi < 4; bi++)
            {
                *fifo = d[bi];

                t1 = 100000;
                while ((!(*cs & CS_TXD)) && (--t1));
                if (t1 == 0)
                    break;
            }

            *cs = CS_TA | CS_CLEAR_RX;

            if (t1 == 0)
                break;
        }

        // END frame
        if (t1 > 0) for (bi = 0; bi < 4; bi++)
        {
            *fifo = 0xFF;

            t1 = 100000;
            while ((!(*cs & CS_TXD)) && (--t1));
            if (t1 == 0)
                break;
        }

        *cs = CS_TA | CS_CLEAR_RX;

        t2 = 100000;
        while ((!(*cs & CS_DONE)) && (--t2));
        if (t2 == 0)
            break;

        *GPSET0(g) = gpio;

        KeReleaseSpinLock(&deviceContext->frameLock, Irql1);
    }

    if (t1 == 0)
        Err("TXD hang  bi %d  CS %08X", bi, *R_CS(b));

    if (t2 == 0)
        Err("DONE hang  CS %08X", *R_CS(b));

    // disable data gate
    *GPSET0(g) = (1 << 22);

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;

    return t1 == 0;
}

VOID
gnkspiClearDotstar(
    _In_  PDEVICE_CONTEXT deviceContext
    )
{
    KIRQL Irql1;
    LONG ledCount;
    ULONG* b = deviceContext->regVirt;
    ULONG* g = deviceContext->gpioVirt;
    int t1 = 0, t2 = 0;
    LONG li, bi = 0;    // led, byte indices
    volatile ULONG* fifo = R_FIFO(b);
    volatile ULONG* cs = R_CS(b);
    int s = 0;

    Tr4("");

    KeAcquireSpinLock(&deviceContext->frameLock, &Irql1);

    ledCount = GNKSPL_MAX_LED_COUNT;

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;
    *cs = CS_TA | CS_CLEAR_TX | CS_CLEAR_RX;

    // enable all gates
    ULONG gpio = (1 << 22) | (1 << 23) | (1 << 24) | (1 << 25);
    *GPCLR0(g) = gpio;

    // start frame
    for (bi = 0; bi < 4; bi++)
    {
        *fifo = 0;
        s++;

        t1 = 100000;
        while ((!(*cs & CS_TXD)) && (--t1));
        if (t1 == 0)
            break;
    }

    *cs = CS_TA | CS_CLEAR_RX;

    // LED frames
    if (t1 > 0) for (li = 0; li < ledCount; li++)
    {
        BYTE d[4] = { 0xFF, 0, 0, 0 };

        for (bi = 0; bi < 4; bi++)
        {
            *fifo = d[bi];
            s++;

            t1 = 100000;
            while ((!(*cs & CS_TXD)) && (--t1));
            if (t1 == 0)
                break;
        }

        *cs = CS_TA | CS_CLEAR_RX;

        if (t1 == 0)
            break;
    }

    // END frame
    if (t1 > 0)  for (bi = 0; bi < 4; bi++)
    {
        *fifo = 0xFF;
        s++;

        t1 = 100000;
        while ((!(*cs & CS_TXD)) && (--t1));
        if (t1 == 0)
            break;
    }

    *cs = CS_TA | CS_CLEAR_RX;

    t2 = 100000;
    while ((!(*cs & CS_DONE)) && (--t2));

    KeReleaseSpinLock(&deviceContext->frameLock, Irql1);

    if (t1 == 0)
        Err("TXD hang  s %d  bi %d  CS %08X", s, bi, *R_CS(b));

    if (t2 == 0)
        Err("DONE hang  s %d  CS %08X", s, *R_CS(b));

    *GPSET0(g) = gpio;

    *cs = CS_CLEAR_TX | CS_CLEAR_RX;
}

