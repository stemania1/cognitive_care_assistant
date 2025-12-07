import { NextRequest } from 'next/server';
import { getEMGData, subscribeToData } from '@/lib/emg-data-store';

// SSE endpoint for real-time EMG data streaming
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('📡 SSE connection request received');
  
  try {
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        console.log('📡 SSE stream started');
        
        const send = (data: any) => {
          if (isClosed) {
            return;
          }
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error('Error sending SSE message:', error);
          }
        };

        // Send initial data
        try {
          const initialData = getEMGData();
          console.log('📡 Sending initial data:', { dataCount: initialData.dataCount });
          send({
            type: 'initial',
            ...initialData
          });
        } catch (error) {
          console.error('Error getting initial data:', error);
          send({
            type: 'error',
            message: 'Failed to get initial data'
          });
        }

        // Subscribe to new data
        try {
          unsubscribe = subscribeToData((newData) => {
            if (isClosed) {
              return;
            }
            try {
              const currentData = getEMGData();
              send({
                type: 'update',
                newData: newData,
                ...currentData
              });
            } catch (error) {
              console.error('Error in data subscription callback:', error);
            }
          });
          console.log('📡 Subscribed to data updates');
        } catch (error) {
          console.error('Error subscribing to data:', error);
        }

        // Send heartbeat every 5 seconds to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (isClosed) {
            return;
          }
          try {
            const currentData = getEMGData();
            send({
              type: 'heartbeat',
              ...currentData
            });
          } catch (error) {
            console.error('Error sending heartbeat:', error);
          }
        }, 5000);

        // Clean up on close
        const cleanup = () => {
          if (isClosed) {
            return;
          }
          isClosed = true;
          console.log('📡 SSE stream cleaning up');
          if (unsubscribe) {
            unsubscribe();
          }
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          try {
            controller.close();
          } catch (error) {
            console.error('Error closing controller:', error);
          }
        };

        request.signal.addEventListener('abort', cleanup);
      },
      cancel() {
        console.log('📡 SSE stream cancelled');
        isClosed = true;
        if (unsubscribe) {
          unsubscribe();
        }
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('❌ Error creating SSE stream:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create SSE stream', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

