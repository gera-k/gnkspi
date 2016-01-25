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

    public.h

Abstract:

    This module contains the common declarations shared by driver
    and user applications.

Environment:

    user and kernel

--*/

//
// Define an Interface Guid so that app can find the device and talk to it.
//

DEFINE_GUID (GUID_DEVINTERFACE_gnkspi,
    0xde0dbb94,0x7f49,0x415d,0x80,0xf6,0x16,0x8b,0x68,0x72,0xe2,0xb3);
// {de0dbb94-7f49-415d-80f6-168b6872e2b3}

#define GNKSPL_REFRESH_UNIT 10      // milliseconds
#define GNKSPL_MAX_STEP_COUNT 128
#define GNKSPL_MAX_ROW_COUNT 4
#define GNKSPL_MAX_LED_COUNT 256

#define IOCTL_GNKSPI(_func_)	CTL_CODE( 'gn', 0x0900+_func_, METHOD_BUFFERED, FILE_READ_DATA | FILE_WRITE_DATA )

typedef enum _GNKSPI_FRAME_FORMAT
{
    GNKSPI_FRAME_INVALID = 0,

    GNKSPI_FRAME_BASE,          // base frame data
    GNKSPI_FRAME_UPDATE,        // previous frame update
    GNKSPI_FRAME_TRANSITION,    // linear interpolation target
                                
    GNKSPI_FRAME_MAX_FORMAT
} GNKSPI_FRAME_FORMAT;

// Show stream:
//      - total size - 2 bytes LE
//      - refresh period - 1 byte (in GNKSPL_REFRESH_UNIT)
//      - step count - 1 byte (from 1 to GNKSPL_MAX_STEP_COUNT)
//      - step 0
//          - step duration - 2 bytes (in refresh periods)
//          - step repeat count - 2 bytes
//          - step format - 1 byte (GNKSPI_SHOW_INVALID+1..GNKSPI_SHOW_MAX_FORMAT-1)
//          - step data
//              format FRAME:
//                  - row count - 1 byte (1..GNKSPL_MAX_ROW_COUNT)
//                  - row 0 data:
//                      - led count - 1 byte (1..GNKSPL_MAX_LED_COUNT) 
//                      - led 0 value - 3bytes RR GG BB
//                      - led 1 value
//                      - led ...
//                  - row 1 data:
//                      - led count
//                      - ...
//                  Notes: 
//                      - FRAME is static so total frame duration is 'duration' * 'repeat count'
//
//              format UPDATE - contains LED update for all rows and leds as defined by the last frame
//                  - led update - 3 signed bytes for each led in the last FRAME
//                  - ...
//                  Notes:
//                      - update is applied to current frame being displayed
//                      - update is applied every 'duration' cycles
//                      - step is repeated 'repeat count' times so after its applied last time,
//                          the LED values differ from initial values by 'repeat count' * 'led update'
//                      - each LED is updated individually as signed byte addition, carry bit is ignored
//                      - total frame duration is 'duration' * 'repeat count'
//
//              format TRANSITION - contains destination LED values for linear interpolation
//                  - led value - 3 bytes for each led in the last FRAME
//                  - ...
//                  Notes:
//                      - update is applied to last FRAME
//                      - 'repeat count' is number of steps in transition
//                      - each step is displayed during 'duration' refresh cycles               
//                      - total frame duration is 'duration' * 'repeat count'
//
//              format X - TBD
//      - step 1
//          - ...
//      - step ...

// IOCTL_GNKSPI_GET_SHOW - read show stream
// input - show stream
#define IOCTL_GNKSPI_GET_SHOW  IOCTL_GNKSPI(0x01)

// IOCTL_GNKSPI_SET_SHOW - write new show stream and start show
// output - show stream
#define IOCTL_GNKSPI_SET_SHOW  IOCTL_GNKSPI(0x02)

// IOCTL_GNKSPI_CLR_SHOW - stop current show
// output - show stream
#define IOCTL_GNKSPI_CLR_SHOW  IOCTL_GNKSPI(0x03)

typedef enum _GNKSPI_HW_TYPE
{
    GNKSPI_HW_UNKNOWN = 0,
    GNKSPI_HW_LIGHTSTAR,
    GNKSPI_HW_LEDPANEL,

    GNKSPI_HW_MAX
} GNKSPI_HW_TYPE;

typedef enum _GNKSPI_LED_TYPE
{
    GNKSPI_LED_UNKNOWN = 0,
    GNKSPI_LED_NEOPIXEL,
    GNKSPI_LED_DOTSTAR,

    GNKSPI_LED_MAX
} GNKSPI_LED_TYPE;

typedef struct _GNKSPI_HW
{
    ULONG size;                             // size of this structure
    USHORT refreshUnit;                     // refresh unit
    GNKSPI_HW_TYPE hwType;                  // hardware config type
    GNKSPI_LED_TYPE ledType;                // led type used
    USHORT rowCount;                        // number of rows
    USHORT ledCount[GNKSPL_MAX_ROW_COUNT];  // leds per row
} GNKSPI_HW, *PGNKSPI_HW;

// known HW configurations
static inline void GNKSPI_HW_CONFIG_LIGHTSTAR(PGNKSPI_HW hw)
{
    hw->hwType = GNKSPI_HW_LIGHTSTAR;
    hw->ledType = GNKSPI_LED_NEOPIXEL;
    hw->rowCount = 4;
    hw->ledCount[0] =
    hw->ledCount[1] =
    hw->ledCount[2] =
    hw->ledCount[3] = 60;
}

static inline void GNKSPI_HW_CONFIG_LEDPANEL(PGNKSPI_HW hw)
{
    hw->hwType = GNKSPI_HW_LEDPANEL;
    hw->ledType = GNKSPI_LED_DOTSTAR;
    hw->rowCount = 1;
    hw->ledCount[0] = 240;
}

// IOCTL_GNKSPI_GET_HW - get hardware properties
// input - GNKSPI_HW
#define IOCTL_GNKSPI_GET_HW  IOCTL_GNKSPI(0x04)

// IOCTL_GNKSPI_SET_HW - set hardware properties
// output - GNKSPI_HW
#define IOCTL_GNKSPI_SET_HW  IOCTL_GNKSPI(0x05)

// {EEF50AC7-31A6-48F5-8EC9-4D9267C35458} - Property category
DEFINE_DEVPROPKEY(gnkspiShow0, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 2);
DEFINE_DEVPROPKEY(gnkspiShow1, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 3);
DEFINE_DEVPROPKEY(gnkspiShow2, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 4);
DEFINE_DEVPROPKEY(gnkspiShow3, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 5);
DEFINE_DEVPROPKEY(gnkspiShow4, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 6);
DEFINE_DEVPROPKEY(gnkspiShow5, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 7);
DEFINE_DEVPROPKEY(gnkspiShow6, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 8);
DEFINE_DEVPROPKEY(gnkspiShow7, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 9);
DEFINE_DEVPROPKEY(gnkspiShow8, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 10);
DEFINE_DEVPROPKEY(gnkspiShow9, 0xeef50ac7, 0x31a6, 0x48f5, 0x8e, 0xc9, 0x4d, 0x92, 0x67, 0xc3, 0x54, 0x58, 11);


