import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'event-materials';

let blobServiceClient = null;
let containerClient = null;

async function getAzureContainer() {
  if (connectionString) {
    if (!blobServiceClient) {
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      containerClient = blobServiceClient.getContainerClient(containerName);
      // Ensure the container exists
      await containerClient.createIfNotExists({ access: 'blob' });
    }
    return containerClient;
  }
  return null;
}

/**
 * Uploads a file (Buffer) and returns the public URL.
 * @param {Buffer} buffer The file contents as a buffer
 * @param {string} filename The original filename
 * @param {string} mimeType The file mimetype
 * @returns {Promise<string>} The uploaded file URL
 */
export async function uploadFile(buffer, filename, mimeType) {
  const cleanFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const container = await getAzureContainer();

  if (container) {
    // Azure Blob Storage upload
    const blockBlobClient = container.getBlockBlobClient(cleanFilename);
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType }
    });
    return blockBlobClient.url;
  } else {
    // Local File System upload
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, cleanFilename);
    await fs.promises.writeFile(filePath, buffer);
    
    // Return relative URL for Next.js public assets serving
    return `/uploads/${cleanFilename}`;
  }
}
