import { NextRequest, NextResponse } from 'next/server';
import { driveService } from '@/lib/drive';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ driveId: string }> }
) {
    const params = await props.params;
    const driveId = params.driveId;
    const { searchParams } = new URL(request.url);
    const isThumbnail = searchParams.get('thumbnail') === 'true';

    if (!driveId) {
        return new NextResponse('Missing Drive ID', { status: 400 });
    }

    try {
        // If thumbnail is requested, redirect to the thumbnail link or proxy it
        // Proxying is safer to avoid CORS issues and keep the URL clean
        if (isThumbnail) {
            const thumbnailUrl = await driveService.getThumbnailUrl(driveId);
            if (thumbnailUrl) {
                // Fetch the thumbnail content
                const thumbRes = await fetch(thumbnailUrl);
                if (!thumbRes.ok) throw new Error('Failed to fetch thumbnail');

                const blob = await thumbRes.blob();
                return new NextResponse(blob, {
                    headers: {
                        'Content-Type': thumbRes.headers.get('Content-Type') || 'image/jpeg',
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }
            // Fallback to full image if no thumbnail
        }

        console.log(`API Route hit for driveId: ${driveId}`);
        const fileData = await driveService.getFileStream(driveId);

        if (!fileData) {
            console.error(`File data not found for driveId: ${driveId}`);
            return new NextResponse('File not found or inaccessible', { status: 404 });
        }

        console.log(`Streaming file: ${driveId}, Mime: ${fileData.mimeType}, Length: ${fileData.length}`);

        // Create a new ReadableStream from the Node.js Readable stream
        const stream = new ReadableStream({
            start(controller) {
                fileData.stream.on('data', (chunk) => controller.enqueue(chunk));
                fileData.stream.on('end', () => controller.close());
                fileData.stream.on('error', (err) => {
                    console.error('Stream error:', err);
                    controller.error(err);
                });
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': fileData.mimeType || 'application/octet-stream',
                'Content-Length': fileData.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
