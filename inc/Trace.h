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

    Trace.h

Abstract:

    Header file for the debug tracing related function defintions and macros.

Environment:

    Kernel mode

--*/

#define WPP_ENABLE

#include "evntrace.h"       // ETW Trace Levels defined in evntrace.h

#define MSG_CRIT    TRACE_LEVEL_CRITICAL
#define MSG_ERR     TRACE_LEVEL_ERROR
#define MSG_WRN     TRACE_LEVEL_WARNING
#define MSG_MSG     TRACE_LEVEL_INFORMATION
#define MSG_TR0     TRACE_LEVEL_VERBOSE
#define MSG_TR1     TRACE_LEVEL_RESERVED6
#define MSG_TR2     TRACE_LEVEL_RESERVED7
#define MSG_TR3     TRACE_LEVEL_RESERVED8
#define MSG_TR4     TRACE_LEVEL_RESERVED9

//
// Define the tracing flags.
//
// Tracing GUID - c3c4f40d-cc34-4006-9329-b958d3d8588f
//

#define WPP_CONTROL_GUIDS                                       \
    WPP_DEFINE_CONTROL_GUID(                                    \
        gnkspiTraceGuid, (c3c4f40d,cc34,4006,9329,b958d3d8588f), \
                                                                \
        WPP_DEFINE_BIT(TRACE_ALL)                               \
        WPP_DEFINE_BIT(TRACE_DRIVER)                            \
        WPP_DEFINE_BIT(TRACE_DEVICE)                            \
        WPP_DEFINE_BIT(TRACE_QUEUE)                             \
        )                             

#define WPP_FLAG_LEVEL_LOGGER(flag, level)                      \
    WPP_LEVEL_LOGGER(flag)

#define WPP_FLAG_LEVEL_ENABLED(flag, level)                     \
    (WPP_LEVEL_ENABLED(flag) &&                                 \
     WPP_CONTROL(WPP_BIT_ ## flag).Level >= level)

#define WPP_LEVEL_FLAGS_LOGGER(lvl,flags) \
           WPP_LEVEL_LOGGER(flags)
               
#define WPP_LEVEL_FLAGS_ENABLED(lvl, flags) \
           (WPP_LEVEL_ENABLED(flags) && WPP_CONTROL(WPP_BIT_ ## flags).Level >= lvl)

#ifndef WPP_BIT_TRACE_FLAG
#define WPP_BIT_TRACE_FLAG WPP_BIT_TRACE_ALL
#endif

#define WPP_LEVEL_FLAGS_TITLE_BUFFER_LENGTH_LOGGER(l,f,t,b,s) WPP_LEVEL_FLAGS_LOGGER(l,f)
#define WPP_LEVEL_FLAGS_TITLE_BUFFER_LENGTH_ENABLED(l,f,t,b,s) WPP_LEVEL_FLAGS_ENABLED(l, f)

//
// This comment block is scanned by the trace preprocessor to define our
// Trace function.
//
// begin_wpp config
// FUNC Trace{FLAG=MYDRIVER_ALL_INFO}(LEVEL, MSG, ...);
// FUNC TraceEvents(LEVEL, FLAGS, MSG, ...);
// end_wpp
//

// custom HEXDUMP type
//
typedef struct xstr { char* buf; short len; } xstr_t;
__inline xstr_t l_xstr(void* p, short l) { xstr_t xs; xs.buf = (char*)p; xs.len = l; return xs; }
#define WPP_LOGHEXDUMP(x) WPP_LOGPAIR(2, &((x).len)) WPP_LOGPAIR((x).len, (x).buf)
//
// begin_wpp config
// DEFINE_CPLX_TYPE(HEXDUMP, WPP_LOGHEXDUMP, xstr_t, ItemHEXDump, "s", _HEX_, 0, 2);
// end_wpp

// To disable WPP tracing insert space withn 'begin wpp' so WPP
//  will not recognize these functions and will leave them to CPP (below)
#define begin_ wpp config
// USEPREFIX (Tr0, "%!FUNC!:"); 
// FUNC Err{LEVEL=MSG_ERR,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC Wrn{LEVEL=MSG_WRN,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC Msg{LEVEL=MSG_MSG,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC Tr0{LEVEL=MSG_TR0,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC Tr1{LEVEL=MSG_TR1,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC Tr2{LEVEL=MSG_TR2,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC Tr3{LEVEL=MSG_TR3,FLAGS=TRACE_FLAG}(MSG,...);
// FUNC TrH{LEVEL=MSG_TR0,FLAGS=TRACE_ALL}(TITLE,BUFFER,LENGTH);
// USESUFFIX (TrH, "%s addr %p size 0x%X: %!HEXDUMP!", TITLE, BUFFER, LENGTH, l_xstr(BUFFER,LENGTH) );
// end_wpp

#ifndef begin_wpp

#if defined(_NTDDK_)

#define DBGPREF DBG_MODULE "[%04X.%04X %d]" __FUNCTION__ ": "
#define gkDebug(_level_,_f_,...) if( _level_ <= DBG_LEVEL ) DbgPrintEx( DPFLTR_IHVDRIVER_ID, DPFLTR_ERROR_LEVEL, DBGPREF _f_ "\n", \
    PsGetCurrentProcessId(), PsGetCurrentThreadId(), KeGetCurrentIrql(), __VA_ARGS__ )

#else

#define DBGPREF DBG_MODULE __FUNCTION__ ": "
#define gkDebug(_level_,_f_,...) if( _level_ <= DBG_LEVEL ) printf( DBGPREF _f_ "\n", __VA_ARGS__ )

#endif

#define Err(_f_,...) gkDebug(MSG_ERR, _f_, __VA_ARGS__)
#define Wrn(_f_,...) gkDebug(MSG_WRN, _f_, __VA_ARGS__)
#define Msg(_f_,...) gkDebug(MSG_MSG, _f_, __VA_ARGS__)
#define Tr0(_f_,...) gkDebug(MSG_TR0, _f_, __VA_ARGS__)
#define Tr1(_f_,...) gkDebug(MSG_TR1, _f_, __VA_ARGS__)
#define Tr2(_f_,...) gkDebug(MSG_TR2, _f_, __VA_ARGS__)
#define Tr3(_f_,...) gkDebug(MSG_TR3, _f_, __VA_ARGS__)
#define Tr4(_f_,...) gkDebug(MSG_TR4, _f_, __VA_ARGS__)

static __inline char hex(int x)
{
    if (x <= 9) return (char)('0' + x);
    return (char)('A' + x - 10);
}

static __inline void TrH
(
    const char* Header,  // dump header
    void* Buffer,        // buffer to dump
    size_t Length        // data length to dump
    )
{
    UCHAR* a = (UCHAR*)Buffer;
    size_t i;
    size_t max = 16;

    if (MSG_TR3 <= DBG_LEVEL)

    Tr3("%s addr %p size 0x%X:", Header, Buffer, (unsigned)Length);

    while (Length>0)
    {
        char line[52];
        char *p = line;

        if (Length<max)
            max = Length;

        RtlZeroMemory(line, sizeof(line));

        for (i = 0; i<16; i++)
        {
            if (i<max)
            {
                *p++ = hex((a[i] & 0xf0) >> 4);
                *p++ = hex(a[i] & 0x0f);
            }
            else
            {
                *p++ = ' ';
                *p++ = ' ';
            }
        }

        *p++ = ' ';
        *p++ = ' ';
        *p++ = ' ';

        for (i = 0; i<max; i++)
        {
            if (a[i] < 0x20 || a[i] > 0x7e) *p++ = '.';
            else *p++ = a[i];
        }

        Tr3("0x%04X:%s", (uintptr_t)a & 0xFFFF, line);

        Length -= max;
        a += max;
    }
}

#endif
