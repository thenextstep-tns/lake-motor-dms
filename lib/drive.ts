import { google } from 'googleapis';
import { Readable } from 'stream';

// Service Account credentials from environment variables
const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleDriveService {
    private driveClient: any;

    constructor() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                },
                scopes: SCOPES,
            });
            this.driveClient = google.drive({ version: 'v3', auth });
        } catch (error) {
            console.warn('Google Drive Service not initialized (missing credentials?)', error);
            this.driveClient = null;
        }
    }

    /**
     * Lists all files for a given Folder ID.
     */
    async listFilesInFolder(folderId: string) {
        if (!this.driveClient) return [];

        try {
            const res = await this.driveClient.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
                orderBy: 'name',
            });
            return res.data.files || [];
        } catch (error) {
            console.error('Error listing files from Drive:', error);
            return [];
        }
    }

    /**
     * Extracts Folder ID from a Google Drive URL.
     */
    getFolderIdFromUrl(url: string): string | null {
        if (!url) return null;
        // Match patterns like /folders/12345... or id=12345...
        const folderMatch = url.match(/folders\/([a-zA-Z0-9-_]+)/);
        if (folderMatch) return folderMatch[1];

        const idMatch = url.match(/id=([a-zA-Z0-9-_]+)/);
        if (idMatch) return idMatch[1];

        return null;
    }

    /**
     * Gets a readable stream of the file content.
     */
    async getFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string; length: number } | null> {
        if (!this.driveClient) {
            console.error('Google Drive Client is not initialized');
            return null;
        }

        try {
            console.log(`Fetching file stream for ID: ${fileId}`);
            // Get metadata first for mimeType and size
            const metadata = await this.driveClient.files.get({
                fileId,
                fields: 'size, mimeType',
            });
            console.log(`File metadata:`, metadata.data);

            const res = await this.driveClient.files.get({
                fileId,
                alt: 'media',
            }, { responseType: 'stream' });

            console.log(`File stream obtained for ID: ${fileId}`);
            return {
                stream: res.data,
                mimeType: metadata.data.mimeType,
                length: parseInt(metadata.data.size || '0'),
            };
        } catch (error) {
            console.error('Error getting file stream:', error);
            return null;
        }
    }
    /**
     * Gets the thumbnail link for a file.
     */
    async getThumbnailUrl(fileId: string): Promise<string | null> {
        if (!this.driveClient) return null;

        try {
            const res = await this.driveClient.files.get({
                fileId,
                fields: 'thumbnailLink',
            });
            return res.data.thumbnailLink || null;
        } catch (error) {
            console.error('Error getting thumbnail link:', error);
            return null;
        }
    }
}

export const driveService = new GoogleDriveService();
