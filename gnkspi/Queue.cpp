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

    queue.c

Abstract:

    This file contains the queue entry points and callbacks.

Environment:

    Kernel-mode Driver Framework

--*/

#include "driver.h"
#include "device.h"
#include "queue.tmh"

#ifdef ALLOC_PRAGMA
#pragma alloc_text (PAGE, gkspiQueueInitialize)
#endif

NTSTATUS
gkspiQueueInitialize(
    _In_ WDFDEVICE Device
    )
/*++

Routine Description:


     The I/O dispatch callbacks for the frameworks device object
     are configured in this function.

     A single default I/O Queue is configured for parallel request
     processing, and a driver context memory allocation is created
     to hold our structure QUEUE_CONTEXT.

Arguments:

    Device - Handle to a framework device object.

Return Value:

    VOID

--*/
{
    WDFQUEUE queue;
    NTSTATUS status;
    WDF_IO_QUEUE_CONFIG    queueConfig;

    PAGED_CODE();

    Tr1("enter");

    //
    // Configure a default queue so that requests that are not
    // configure-fowarded using WdfDeviceConfigureRequestDispatching to goto
    // other queues get dispatched here.
    //
    WDF_IO_QUEUE_CONFIG_INIT_DEFAULT_QUEUE(
         &queueConfig,
        WdfIoQueueDispatchParallel
        );

    queueConfig.EvtIoDeviceControl = gkspiEvtIoDeviceControl;
    queueConfig.EvtIoStop = gkspiEvtIoStop;

    status = WdfIoQueueCreate(
                 Device,
                 &queueConfig,
                 WDF_NO_OBJECT_ATTRIBUTES,
                 &queue
                 );

    if( !NT_SUCCESS(status) ) {
        Err("WdfIoQueueCreate failed 0x%08X", status);
        return status;
    }

    Tr1("return 0x%08X", status);

    return status;
}

VOID
gkspiEvtIoDeviceControl(
    _In_ WDFQUEUE Queue,
    _In_ WDFREQUEST Request,
    _In_ size_t OutputBufferLength,
    _In_ size_t InputBufferLength,
    _In_ ULONG IoControlCode
    )
/*++

Routine Description:

    This event is invoked when the framework receives IRP_MJ_DEVICE_CONTROL request.

Arguments:

    Queue -  Handle to the framework queue object that is associated with the
             I/O request.

    Request - Handle to a framework request object.

    OutputBufferLength - Size of the output buffer in bytes

    InputBufferLength - Size of the input buffer in bytes

    IoControlCode - I/O control code.

Return Value:

    VOID

--*/
{
    NTSTATUS status = STATUS_INVALID_DEVICE_REQUEST;
    WDFDEVICE Device;
    PDEVICE_CONTEXT deviceContext;
    
    Tr1("Queue 0x%p, Request 0x%p  OBL %d  IBL %d  IoControlCode %d",
                Queue, Request, (int) OutputBufferLength, (int) InputBufferLength, IoControlCode);

    Device = WdfIoQueueGetDevice(Queue);
    deviceContext = DeviceGetContext(Device);

    switch (IoControlCode)
    {
    case IOCTL_GNKSPI_GET_SHOW:
    {
        PVOID outBuf;
        size_t outLength;
        PVOID memBuf;
        size_t memLength;

        Tr1("IOCTL_GNKSPI_GET_SHOW");
        if (deviceContext->showStream == WDF_NO_HANDLE)
        {
            Err("Requested stream not found");
            status = STATUS_INVALID_PARAMETER;
            break;
        }

        status = WdfRequestRetrieveOutputBuffer(	// retrieves an I/O request's input buffer
            Request,                // IN WDFREQUEST  Request,
            sizeof(USHORT),         // IN size_t  MinimumRequiredSize,
            &outBuf,                // OUT PVOID*  Buffer,
            &outLength              // OUT size_t*  Length
            );
        if (!NT_SUCCESS(status)) {
            Err("WdfRequestRetrieveOutputBuffer failed; status 0x%X", status);
            break;
        }

        memBuf = WdfMemoryGetBuffer(deviceContext->showStream, &memLength);

        if (outLength < memLength)
        {
            *(USHORT*)outBuf = (USHORT)memLength;
            WdfRequestCompleteWithInformation(Request, STATUS_BUFFER_TOO_SMALL, sizeof(USHORT));
        }
        else
        {
            status = WdfMemoryCopyToBuffer(deviceContext->showStream, 0, outBuf, memLength);
            if (!NT_SUCCESS(status)) {
                Err("WdfMemoryCopyToBuffer failed; status 0x%X", status);
            }

            WdfRequestCompleteWithInformation(Request, status, memLength);
        }

        return;
    }

    case IOCTL_GNKSPI_SET_SHOW:
    {
        PVOID inBuf;
        size_t Length;

        Tr1("IOCTL_GNKSPI_SET_SHOW");

        status = WdfRequestRetrieveInputBuffer(	// retrieves an I/O request's input buffer
            Request,                // IN WDFREQUEST  Request,
            sizeof(USHORT),         // IN size_t  MinimumRequiredSize,
            &inBuf,                 // OUT PVOID*  Buffer,
            &Length                 // OUT size_t*  Length
            );
        if (!NT_SUCCESS(status)) 
        {
            Err("WdfRequestRetrieveInputBuffer failed; status 0x%X", status);
            break;
        }

        // stop current show
        gnkspiShow0Stop(deviceContext, TRUE);

        if (deviceContext->showStream != WDF_NO_HANDLE)
        {
            WdfObjectDelete(deviceContext->showStream);
            deviceContext->showStream = WDF_NO_HANDLE;
        }

        status = WdfMemoryCreate(
            WDF_NO_OBJECT_ATTRIBUTES,       // [in, optional]  PWDF_OBJECT_ATTRIBUTES Attributes,
            NonPagedPool,                   // [in]            POOL_TYPE              PoolType,
            0,                              // [in, optional]  ULONG                  PoolTag,
            Length,                         // [in]            size_t                 BufferSize,
            &deviceContext->showStream,     // [out]           WDFMEMORY              *Memory,
            NULL                            // [out, optional] PVOID                  *Buffer
            );
        if (!NT_SUCCESS(status)) 
        {
            Err("WdfMemoryCreate failed; status 0x%X", status);
            break;
        }

        status = WdfMemoryCopyFromBuffer(
            deviceContext->showStream,      // [in] WDFMEMORY DestinationMemory,
            0,                              // [in] size_t    DestinationOffset,
            inBuf,                          // [in] PVOID     Buffer,
            Length                          // [in] size_t    NumBytesToCopyFrom
            );

        if (!NT_SUCCESS(status)) 
        {
            Err("WdfMemoryCopyFromBuffer failed; status 0x%X", status);
            break;
        }

        // parse stream and start show
        status = gnkspiSetShowStream(deviceContext);
        if (!NT_SUCCESS(status)) 
        {
            Err("SetShowStream failed; status 0x%X", status);
            WdfObjectDelete(deviceContext->showStream);
            deviceContext->showStream = WDF_NO_HANDLE;
            break;
        }
        else
        {
            gnkspiShow0Start(deviceContext);
        }

        WdfRequestCompleteWithInformation(Request, STATUS_SUCCESS, Length);

        return;
    }

    case IOCTL_GNKSPI_CLR_SHOW:
    {
        Tr1("IOCTL_GNKSPI_CLR_SHOW");

        // stop current show
        gnkspiShow0Stop(deviceContext, TRUE);
        gnkspiClear(deviceContext);

        if (deviceContext->showStream != WDF_NO_HANDLE)
        {
            WdfObjectDelete(deviceContext->showStream);
            deviceContext->showStream = WDF_NO_HANDLE;
        }

        status = STATUS_SUCCESS;

        break;
    }

    default:
        Err("Invalid IOCTL 0x%X", IoControlCode);
        status = STATUS_INVALID_DEVICE_REQUEST;
    }

    WdfRequestComplete(Request, status);

    return;
}

VOID
gkspiEvtIoStop(
    _In_ WDFQUEUE Queue,
    _In_ WDFREQUEST Request,
    _In_ ULONG ActionFlags
)
/*++

Routine Description:

    This event is invoked for a power-managed queue before the device leaves the working state (D0).

Arguments:

    Queue -  Handle to the framework queue object that is associated with the
             I/O request.

    Request - Handle to a framework request object.

    ActionFlags - A bitwise OR of one or more WDF_REQUEST_STOP_ACTION_FLAGS-typed flags
                  that identify the reason that the callback function is being called
                  and whether the request is cancelable.

Return Value:

    VOID

--*/
{
    Tr1("Queue 0x%p, Request 0x%p ActionFlags %d",
                Queue, Request, ActionFlags);

    //
    // In most cases, the EvtIoStop callback function completes, cancels, or postpones
    // further processing of the I/O request.
    //
    // Typically, the driver uses the following rules:
    //
    // - If the driver owns the I/O request, it calls WdfRequestUnmarkCancelable
    //   (if the request is cancelable) and either calls WdfRequestStopAcknowledge
    //   with a Requeue value of TRUE, or it calls WdfRequestComplete with a
    //   completion status value of STATUS_SUCCESS or STATUS_CANCELLED.
    //
    //   Before it can call these methods safely, the driver must make sure that
    //   its implementation of EvtIoStop has exclusive access to the request.
    //
    //   In order to do that, the driver must synchronize access to the request
    //   to prevent other threads from manipulating the request concurrently.
    //   The synchronization method you choose will depend on your driver's design.
    //
    //   For example, if the request is held in a shared context, the EvtIoStop callback
    //   might acquire an internal driver lock, take the request from the shared context,
    //   and then release the lock. At this point, the EvtIoStop callback owns the request
    //   and can safely complete or requeue the request.
    //
    // - If the driver has forwarded the I/O request to an I/O target, it either calls
    //   WdfRequestCancelSentRequest to attempt to cancel the request, or it postpones
    //   further processing of the request and calls WdfRequestStopAcknowledge with
    //   a Requeue value of FALSE.
    //
    // A driver might choose to take no action in EvtIoStop for requests that are
    // guaranteed to complete in a small amount of time.
    //
    // In this case, the framework waits until the specified request is complete
    // before moving the device (or system) to a lower power state or removing the device.
    // Potentially, this inaction can prevent a system from entering its hibernation state
    // or another low system power state. In extreme cases, it can cause the system
    // to crash with bugcheck code 9F.
    //

    return;
}

