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


#pragma once
/*++

Module Name:

    device.h

Abstract:

    This file contains the device definitions.

Environment:

    Kernel-mode Driver Framework

--*/

#include "public.h"

#define REG(_b_,_o_) (volatile ULONG*)((BYTE*)(_b_) + (_o_))
#define R_CS(_b_)       REG(_b_,0x00)
#define R_FIFO(_b_)     REG(_b_,0x04)
#define R_CLK(_b_)      REG(_b_,0x08)
#define R_DLEN(_b_)     REG(_b_,0x0C)
#define R_LTOH(_b_)     REG(_b_,0x10)
#define R_DC(_b_)       REG(_b_,0x14)

#define CS_CSPOL2       (1 << 23)
#define CS_CSPOL1       (1 << 22)
#define CS_CSPOL0       (1 << 21)
#define CS_RXF          (1 << 20)
#define CS_RXR          (1 << 19)
#define CS_TXD          (1 << 18)
#define CS_RXD          (1 << 17)
#define CS_DONE         (1 << 16)
#define CS_LEN          (1 << 13)
#define CS_REN          (1 << 12)
#define CS_ADCS         (1 << 11)
#define CS_INTR         (1 << 10)
#define CS_INTD         (1 << 9)
#define CS_DMAEN        (1 << 8)
#define CS_TA           (1 << 7)
#define CS_CSPOL        (1 << 6)
#define CS_CLEAR_TX     (1 << 4)
#define CS_CLEAR_RX     (2 << 4)
#define CS_CPOL         (1 << 3)
#define CS_CPHA         (1 << 2)
#define CS_CS0          (0 << 0)
#define CS_CS1          (1 << 0)
#define CS_CS2          (2 << 0)

#define GPFSEL0(_b_) REG(_b_,0x00)  // GPIO Function Select 0 32 R / W
#define GPFSEL1(_b_) REG(_b_,0x04)  // GPIO Function Select 1 32 R / W
#define GPFSEL2(_b_) REG(_b_,0x08)  // GPIO Function Select 2 32 R / W
#define GPFSEL3(_b_) REG(_b_,0x0C)  // GPIO Function Select 3 32 R / W
#define GPFSEL4(_b_) REG(_b_,0x10)  // GPIO Function Select 4 32 R / W
#define GPFSEL5(_b_) REG(_b_,0x14)  // GPIO Function Select 5 32 R / W
#define GPSET0(_b_) REG(_b_,0x1C)   // GPIO Pin Output Set 0 32 W
#define GPSET1(_b_) REG(_b_,0x20)   // GPIO Pin Output Set 1 32 W
#define GPCLR0(_b_) REG(_b_,0x28)   // GPIO Pin Output Clear 0 32 W
#define GPCLR1(_b_) REG(_b_,0x2C)   // GPIO Pin Output Clear 1 32 W
#define GPLEV0(_b_) REG(_b_,0x34)   // GPIO Pin Level 0 32 R
#define GPLEV1(_b_) REG(_b_,0x38)   // GPIO Pin Level 1 32 R
#define GPEDS0(_b_) REG(_b_,0x40)   // GPIO Pin Event Detect Status 0 32 R / W
#define GPEDS1(_b_) REG(_b_,0x44)   // GPIO Pin Event Detect Status 1 32 R / W
#define GPREN0(_b_) REG(_b_,0x4C)   // GPIO Pin Rising Edge Detect Enable 0 32 R / W
#define GPREN1(_b_) REG(_b_,0x50)   // GPIO Pin Rising Edge Detect Enable 1 32 R / W
#define GPFEN0(_b_) REG(_b_,0x58)   // GPIO Pin Falling Edge Detect Enable 0 32 R / W
#define GPFEN1(_b_) REG(_b_,0x5C)   // GPIO Pin Falling Edge Detect Enable 1 32 R / W
#define GPHEN0(_b_) REG(_b_,0x64)   // GPIO Pin High Detect Enable 0 32 R / W
#define GPHEN1(_b_) REG(_b_,0x68)   // GPIO Pin High Detect Enable 1 32 R / W
#define GPLEN0(_b_) REG(_b_,0x70)   // GPIO Pin Low Detect Enable 0 32 R / W
#define GPLEN1(_b_) REG(_b_,0x74)   // GPIO Pin Low Detect Enable 1 32 R / W
#define GPAREN0(_b_) REG(_b_,0x7C)  // GPIO Pin Async.Rising Edge Detect 0 32 R / W
#define GPAREN1(_b_) REG(_b_,0x80)  // GPIO Pin Async.Rising Edge Detect 1 32 R / W
#define GPAFEN0(_b_) REG(_b_,0x88)  // GPIO Pin Async.Falling Edge Detect 0 32 R / W
#define GPAFEN1(_b_) REG(_b_,0x8C)  // GPIO Pin Async.Falling Edge Detect 1 32 R / W
#define GPPUD(_b_) REG(_b_,0x94)    // GPIO Pin Pull - up / down Enable 32 R / W
#define GPPUDCLK0(_b_) REG(_b_,0x98) // GPIO Pin Pull - up / down Enable Clock 0 32 R / W
#define GPPUDCLK1(_b_) REG(_b_,0x9C) // GPIO Pin Pull - up / down Enable Clock 1 32 R / W

#define GPIO_REG_BASE 0x3F200000
#define GPIO_REG_SIZE 0xA0

EXTERN_C_START

typedef struct _SHOW_STEP               // step info - filled by show stream parser
{
    USHORT duration;            // in refresh periods
    USHORT repeat;              // repeat counter
    BYTE format;                // step format
    USHORT offset;              // offset to beginning of step data in showStream (after 'format' byte)
} SHOW_STEP, *PSHOW_STEP;

//
// The device context performs the same job as
// a WDM device extension in the driver frameworks
//
typedef struct _DEVICE_CONTEXT
{
    PULONG regVirt;
    SIZE_T regSize;

    PULONG gpioVirt;
    SIZE_T gpioSize;

    WDFTIMER refreshTimer;

    // attatched hardware info
    GNKSPI_HW hw;

    // show info
    WDFMEMORY showStream;           // show sequence
    BYTE showRefreshPeriod;        // in GNKSPL_REFRESH_UNIT
    BYTE showStepCount;
    SHOW_STEP showStep[GNKSPL_MAX_STEP_COUNT];

    // current refresh count
    BYTE currRefresh;

    // current step info
    BYTE step;              // current step of the show
    BYTE stepDuration;      // current step duration
    BYTE stepRepeat;        // current repeat counter

    // current frame info
    ULONG* currFrame;       // points to current frame to show
    BYTE currRowCount;
    BYTE currLedCount[GNKSPL_MAX_ROW_COUNT];
    ULONG showFrame1[GNKSPL_MAX_ROW_COUNT * GNKSPL_MAX_LED_COUNT];
    ULONG showFrame2[GNKSPL_MAX_ROW_COUNT * GNKSPL_MAX_LED_COUNT];
    KSPIN_LOCK frameLock;

} DEVICE_CONTEXT, *PDEVICE_CONTEXT;

//
// This macro will generate an inline function called DeviceGetContext
// which will be used to get a pointer to the device context memory
// in a type safe manner.
//
WDF_DECLARE_CONTEXT_TYPE_WITH_NAME(DEVICE_CONTEXT, DeviceGetContext)

NTSTATUS
gnkspiDetectHardware(
    _In_ PDEVICE_CONTEXT deviceContext
    );

//
// Function to initialize the device and its callbacks
//
NTSTATUS
gkspiCreateDevice(
    _Inout_ PWDFDEVICE_INIT DeviceInit
    );

NTSTATUS
gnkspiShow0Frame(
    _In_ PDEVICE_CONTEXT deviceContext,
    _In_ BYTE frameIndex
    );

NTSTATUS
gnkspiSetShowStream(
    _In_ PDEVICE_CONTEXT deviceContext
    );

NTSTATUS
gnkspiClrShowStream(
    _In_ PDEVICE_CONTEXT deviceContext
    );

VOID
gnkspiShow0Start(
    _In_ PDEVICE_CONTEXT deviceContext
    );

VOID
gnkspiShow0Next(
    _In_ PDEVICE_CONTEXT deviceContext
    );

VOID
gnkspiShow0Stop(
    _In_ PDEVICE_CONTEXT deviceContext,
    BOOLEAN WAIT
    );

EVT_WDF_TIMER gnkspiRefresh;

VOID
gnkspiClear(
    _In_  PDEVICE_CONTEXT deviceContext
    );
    
BOOLEAN
gnkspiRefreshNeopixel(
    _In_  PDEVICE_CONTEXT deviceContext
    );

VOID
gnkspiClearNeopixel(
    _In_  PDEVICE_CONTEXT deviceContext
    );

BOOLEAN
gnkspiRefreshDotstar(
    _In_  PDEVICE_CONTEXT deviceContext
    );

VOID
gnkspiClearDotstar(
    _In_  PDEVICE_CONTEXT deviceContext
    );
    
EXTERN_C_END
